import { Injectable } from "@nestjs/common";

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from "@nestjs/websockets";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets/interfaces/hooks";
import { RedisClientType } from "@redis/client";
import { Server } from "http";
import { createClient } from "redis";
import { Socket } from "socket.io";

const EVENT = {
  JOIN: "join",
  CHANNEL_MESSAGE: "channelMessage",
  WHISPER: "whisper",
  LEAVE: "leave",
  EVERYONE: "everyone",
} as const;

@WebSocketGateway({
  namespace: "chat",
  cors: { origin: "*" },
  transports: ["websocket"],
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  redis: RedisClientType;
  async afterInit() {
    this.redis = createClient();
    await this.redis.connect();
  }

  handleConnection(client: Socket) {
    this.redis.set(client.request.headers.authorization, client.id);
  }

  handleDisconnect(client: Socket) {
    this.redis.del(client.request.headers.authorization);
  }

  @SubscribeMessage(EVENT.JOIN)
  joinRoom(
    @MessageBody("room") room: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room.toString());
    return `success join room : ${room}`;
  }

  @SubscribeMessage(EVENT.EVERYONE)
  everyoneMessage(
    @MessageBody("message") message: string,
    @ConnectedSocket() client: Socket,
  ) {
    const from = client.request.headers.authorization;
    client.broadcast.emit(EVENT.EVERYONE, { from, message });
  }

  @SubscribeMessage(EVENT.WHISPER)
  async whisper(@MessageBody() req, @ConnectedSocket() client: Socket) {
    const from = client.request.headers.authorization;
    const target = await this.redis.get(req.target);
    this.server.to(target).emit(EVENT.WHISPER, { from, message: req.message });
  }

  @SubscribeMessage(EVENT.CHANNEL_MESSAGE)
  async listenMessage(
    @MessageBody("room") room: number,
    @MessageBody("message") message: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(room.toString()).emit(EVENT.CHANNEL_MESSAGE, {
      from: await this.redis.get(client.id),
      message,
    });
  }

  @SubscribeMessage(EVENT.LEAVE)
  leaveRoom(
    @MessageBody("room") room: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room.toString());
  }
}
