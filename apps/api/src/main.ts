import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Global prefix
  const prefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(prefix);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Algor Orchestrator API')
    .setDescription('Multi-tenant messaging orchestration platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('tenants', 'Tenants management')
    .addTag('contacts', 'Contacts management')
    .addTag('consents', 'Consent management (152-ФЗ)')
    .addTag('suppressions', 'Suppression list (отписки)')
    .addTag('templates', 'Message templates')
    .addTag('campaigns', 'Campaigns')
    .addTag('segments', 'Audience segments')
    .addTag('orchestration', 'Orchestration rules')
    .addTag('webhooks', 'External webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API запущен на http://localhost:${port}${prefix}`);
  console.log(`📖 Swagger документация: http://localhost:${port}/docs`);
}

bootstrap();

