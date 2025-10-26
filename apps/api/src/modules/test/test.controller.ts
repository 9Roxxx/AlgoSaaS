import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

export class TestMessageDto {
  channel: 'telegram' | 'vk' | 'email' | 'sms' | 'whatsapp';
  recipient: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
}

@Controller('test')
export class TestController {
  constructor() {}

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  async sendTestMessage(@Body() dto: TestMessageDto) {
    try {
      // Симуляция отправки сообщения через разные каналы
      const result = await this.simulateMessageSending(dto);
      
      return {
        success: true,
        message: 'Test message sent successfully',
        channel: dto.channel,
        recipient: dto.recipient,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Test message error:', error);
      return {
        success: false,
        message: 'Failed to send test message',
        error: error.message,
      };
    }
  }

  @Post('telegram/webhook')
  @HttpCode(HttpStatus.OK)
  async telegramWebhook(@Body() body: any) {
    // Симуляция webhook от Telegram
    return {
      success: true,
      message: 'Telegram webhook received',
      data: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('vk/webhook')
  @HttpCode(HttpStatus.OK)
  async vkWebhook(@Body() body: any) {
    // Симуляция webhook от VK
    return {
      success: true,
      message: 'VK webhook received',
      data: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('email/webhook')
  @HttpCode(HttpStatus.OK)
  async emailWebhook(@Body() body: any) {
    // Симуляция webhook от Email провайдера
    return {
      success: true,
      message: 'Email webhook received',
      data: body,
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateMessageSending(dto: TestMessageDto) {
    // Симуляция задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const results = {
      telegram: {
        messageId: 'tg_' + Date.now(),
        status: 'sent',
        provider: 'Telegram Bot API',
        cost: 0,
      },
      vk: {
        messageId: 'vk_' + Date.now(),
        status: 'sent',
        provider: 'VK API',
        cost: 0,
      },
      email: {
        messageId: 'email_' + Date.now(),
        status: 'sent',
        provider: 'Mailgun/SendGrid',
        cost: 0.001,
      },
      sms: {
        messageId: 'sms_' + Date.now(),
        status: 'sent',
        provider: 'SMS Aggregator',
        cost: 0.05,
      },
      whatsapp: {
        messageId: 'wa_' + Date.now(),
        status: 'sent',
        provider: 'Click-to-WhatsApp',
        cost: 0,
      },
    };

    return results[dto.channel];
  }
}
