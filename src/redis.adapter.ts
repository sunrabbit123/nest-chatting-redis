import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
const redisAdapater = require("socket.io-redis");

export class RedisAdapter extends IoAdapter {
  createIOServer(port: number, optinos?: ServerOptions) {
    const server = super.createIOServer(port, optinos);
    const _redisAdapater = redisAdapater({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
    server.adapter(_redisAdapater);
    return server;
  }
}
