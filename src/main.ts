import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { createRateLimitConfig } from './security/rate-limit.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(createRateLimitConfig());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
