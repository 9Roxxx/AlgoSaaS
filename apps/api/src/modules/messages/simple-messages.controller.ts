import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';

export class SendMessageDto {
  channel: 'TELEGRAM' | 'VK' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  recipient: {
    phone?: string;
    email?: string;
    tgId?: string;
    vkUserId?: string;
  };
  content: string;
}

@Controller('messages')
export class MessagesController {
  constructor() {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto) {
    try {
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

      const result = results[dto.channel];

      return {
        success: true,
        message: 'Message sent successfully',
        messageId,
        channel: dto.channel,
        recipient: dto.recipient,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  @Get('status/:channel')
  async getChannelStatus(@Param('channel') channel: string) {
    try {
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

      const status = statuses[channel.toUpperCase()] || { status: 'not_configured' };
      
      return {
        success: true,
        channel: channel.toUpperCase(),
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
    try {
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
    } catch (error) {
      console.error('Template render error:', error);
      return {
        success: false,
        message: 'Failed to render template',
        error: error.message,
      };
    }
  }

  @Get('whatsapp/link')
  async getWhatsAppLink(@Body() body: { phone: string; message: string }) {
    try {
      // Нормализация номера телефона
      let phone = body.phone.replace(/\D/g, '');
      if (phone.startsWith('8')) {
        phone = '7' + phone.substring(1);
      }
      if (!phone.startsWith('7')) {
        phone = '7' + phone;
      }
      
      const link = `https://wa.me/${phone}?text=${encodeURIComponent(body.message)}`;
      
      return {
        success: true,
        link,
        phone: body.phone,
        message: body.message,
      };
    } catch (error) {
      console.error('WhatsApp link error:', error);
      return {
        success: false,
        message: 'Failed to generate WhatsApp link',
        error: error.message,
      };
    }
  }
}
