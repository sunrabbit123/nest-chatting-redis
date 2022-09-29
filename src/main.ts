import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { RedisAdapter } from "./redis.adapter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new RedisAdapter(app));
  await app.listen(process.env.NODE_PORT);
}
bootstrap();
