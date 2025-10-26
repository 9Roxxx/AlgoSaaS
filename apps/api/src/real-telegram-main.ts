import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { TelegramIdResolver } from './telegram-id-resolver';

// Реальный Telegram коннектор
class TelegramConnector {
  private botToken: string;
  private idResolver: TelegramIdResolver;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.idResolver = new TelegramIdResolver(this.botToken);
  }

  async sendMessage(chatIdInput: string, text: string): Promise<any> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured. Please set TELEGRAM_BOT_TOKEN environment variable.');
    }

    try {
      console.log(`\n📨 Попытка отправить сообщение...`);
      console.log(`   Входная данные: ${chatIdInput}`);

      // 🔑 ГЛАВНОЕ: Конвертируем @username в numeric ID
      const actualChatId = await this.idResolver.resolveId(chatIdInput);
      
      console.log(`📤 Отправляем сообщение в Telegram (chat_id: ${actualChatId})`);
      
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: actualChatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      
      console.log(`📥 Ответ от Telegram:`, data);

      if (!response.ok || !data.ok) {
        console.error('❌ Telegram API ошибка:', data);
        throw new Error(`Telegram API error: ${data.description || JSON.stringify(data)}`);
      }

      console.log(`✅ Сообщение отправлено! ID: ${data.result.message_id}\n`);
      
      return {
        success: true,
        messageId: data.result.message_id,
        chatId: data.result.chat.id,
        text: data.result.text,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Telegram send error:', error);
      throw error;
    }
  }

  async getBotInfo(): Promise<any> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
      }

      return data.result;
    } catch (error) {
      console.error('Telegram bot info error:', error);
      throw error;
    }
  }

  getIdResolver(): TelegramIdResolver {
    return this.idResolver;
  }
}

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

// Реальный Messages Controller
@Controller('messages')
export class MessagesController {
  private telegramConnector = new TelegramConnector();

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() body: any) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (body.channel === 'TELEGRAM') {
        // РЕАЛЬНАЯ отправка в Telegram
        const result = await this.telegramConnector.sendMessage(body.recipient.tgId, body.content);
        
        return {
          success: true,
          message: 'Message sent successfully via Telegram Bot API',
          messageId,
          channel: body.channel,
          recipient: body.recipient,
          result: {
            messageId: result.messageId,
            status: 'sent',
            provider: 'Telegram Bot API',
            cost: 0,
            realApiResponse: result,
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        // Симуляция для других каналов
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const results = {
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

        const result = results[body.channel] || results.VK;

        return {
          success: true,
          message: 'Message sent successfully (simulated)',
          messageId,
          channel: body.channel,
          recipient: body.recipient,
          result,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message: 'Failed to send message',
        error: error.message,
        messageId,
        channel: body.channel,
        recipient: body.recipient,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status/:channel')
  async getChannelStatus(@Param('channel') channel: string) {
    try {
      if (channel === 'TELEGRAM') {
        const botInfo = await this.telegramConnector.getBotInfo();
        return {
          success: true,
          channel: 'TELEGRAM',
          status: {
            status: 'configured',
            botInfo,
          },
        };
      }

      const statuses = {
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

      const status = statuses[channel] || { status: 'not_configured' };
      
      return {
        success: true,
        channel: channel,
        status,
      };
    } catch (error) {
      console.error('Channel status error:', error);
      return {
        success: false,
        message: 'Failed to get channel status',
        error: error.message,
      };
    }
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
  console.log(`📱 Telegram Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start API server:', error);
  process.exit(1);
});
