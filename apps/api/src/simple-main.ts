import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './simple-app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.API_PORT || 3001;
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 API Server running on http://${host}:${port}/api/v1`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start API server:', error);
  process.exit(1);
});
