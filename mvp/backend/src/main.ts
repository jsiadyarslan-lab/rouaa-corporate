import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ROUAA-Backend');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Global prefix — all routes under /api/v1
  app.setGlobalPrefix('api/v1');

  // CORS — allow the Vite dev server (and any configured origin)
  app.enableCors({
    origin: process.env.BACKEND_CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe — DTOs are validated automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.BACKEND_PORT ?? 4000;
  await app.listen(port);

  logger.log(`ROUAA Backend API listening on http://localhost:${port}/api/v1`);
  logger.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap ROUAA Backend', err);
  process.exit(1);
});
