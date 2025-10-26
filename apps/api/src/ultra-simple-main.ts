import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Module, Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

// Простой Health Controller
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Algor Orchestrator API',
      version: '1.0.0',
    };
  }
}

// Простой Auth Controller
@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    if (body.email === 'admin@algoritmika.demo' && body.password === 'admin123') {
      return {
        success: true,
        access_token: 'demo-token-' + Date.now(),
        user: {
          id: '1',
          email: 'admin@algoritmika.demo',
          tenantId: 'demo-tenant',
          role: 'ADMIN',
        },
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials',
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { email: string; password: string; name?: string }) {
    return {
      success: true,
      message: 'Registration endpoint (demo mode)',
      user: {
        id: 'new-user-' + Date.now(),
        email: body.email,
        tenantId: 'demo-tenant',
        role: 'USER',
      },
    };
  }
}

// Простой Messages Controller
@Controller('messages')
export class MessagesController {
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() body: any) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Симуляция отправки сообщения
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const results = {
      TELEGRAM: {
        messageId: 'tg_' + Date.now(),
        status: 'sent',
        provider: 'Telegram Bot API',
        cost: 0,
      },
      VK: {
        messageId: 'vk_' + Date.now(),
        status: 'sent',
        provider: 'VK API',
        cost: 0,
      },
      EMAIL: {
        messageId: 'email_' + Date.now(),
        status: 'sent',
        provider: 'Mailgun/SendGrid',
        cost: 0.001,
      },
      SMS: {
        messageId: 'sms_' + Date.now(),
        status: 'sent',
        provider: 'SMS Aggregator',
        cost: 0.05,
      },
      WHATSAPP: {
        messageId: 'wa_' + Date.now(),
        status: 'sent',
        provider: 'Click-to-WhatsApp',
        cost: 0,
      },
    };

    const result = results[body.channel] || results.TELEGRAM;

    return {
      success: true,
      message: 'Message sent successfully',
      messageId,
      channel: body.channel,
      recipient: body.recipient,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status/:channel')
  async getChannelStatus(@Body() body: any) {
    const statuses = {
      TELEGRAM: {
        status: 'configured',
        botInfo: {
          id: '123456789',
          username: 'algor_test_bot',
          first_name: 'Algor Test Bot',
        },
      },
      VK: {
        status: 'configured',
        groupInfo: {
          id: '123456789',
          name: 'Algoritmika Community',
        },
      },
      EMAIL: {
        status: 'configured',
        provider: 'Mailgun',
      },
      SMS: {
        status: 'configured',
        balance: 100.50,
      },
      WHATSAPP: {
        status: 'configured',
        mode: 'Click-to-WhatsApp',
      },
    };

    const status = statuses[body.channel] || { status: 'not_configured' };
    
    return {
      success: true,
      channel: body.channel,
      status,
    };
  }

  @Post('render-template')
  @HttpCode(HttpStatus.OK)
  async renderTemplate(@Body() body: { template: string; variables: Record<string, any> }) {
    let rendered = body.template;
    
    for (const [key, value] of Object.entries(body.variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return {
      success: true,
      rendered,
      original: body.template,
      variables: body.variables,
    };
  }
}

// Простой Test Controller
@Controller('test')
export class TestController {
  @Post('send-message')
  async sendMessage(@Body() body: { channel: string; recipient: string; content: string }) {
    console.log(`Test message to ${body.channel} for ${body.recipient}: ${body.content}`);
    
    return {
      success: true,
      message: 'Test message sent successfully',
      channel: body.channel,
      recipient: body.recipient,
      result: {
        messageId: `${body.channel}_${Date.now()}`,
        status: 'sent',
        provider: `${body.channel.toUpperCase()} API`,
        cost: body.channel === 'email' ? 0.001 : body.channel === 'sms' ? 0.05 : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics')
  async getAnalytics() {
    return {
      period: new Date().toISOString().split('T')[0],
      total_messages: 1250,
      channels: {
        telegram: { sent: 450, delivered: 445, failed: 5 },
        vk: { sent: 300, delivered: 295, failed: 5 },
        email: { sent: 400, delivered: 380, failed: 20 },
        sms: { sent: 100, delivered: 95, failed: 5 },
      },
      costs: { total: 15.5, currency: 'RUB' },
      performance: { delivery_rate: 94.8, avg_delivery_time: '2.3s' },
    };
  }
}

// Простой App Module
@Module({
  controllers: [HealthController, AuthController, MessagesController, TestController],
  providers: [],
})
export class AppModule {}

// Запуск приложения
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
