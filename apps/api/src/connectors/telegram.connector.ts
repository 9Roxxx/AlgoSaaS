import { Injectable } from '@nestjs/common';

export interface SendMessageRequest {
  messageId: string;
  channel: string;
  recipient: {
    phone?: string;
    email?: string;
    tgId?: string;
    vkUserId?: string;
  };
  content: string;
  variables: Record<string, any>;
}

export interface SendMessageResult {
  messageId: string;
  status: 'sent' | 'failed' | 'delivered' | 'bounced';
  providerMessageId?: string;
  error?: string;
  cost?: number;
  timestamp: string;
}

@Injectable()
export class TelegramConnector {
  private botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      if (!this.botToken) {
        throw new Error('Telegram bot token not configured');
      }

      if (!request.recipient.tgId) {
        throw new Error('Telegram ID not provided');
      }

      // Реальная отправка через Telegram Bot API
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: request.recipient.tgId,
          text: request.content,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
      }

      return {
        messageId: request.messageId,
        status: 'sent',
        providerMessageId: data.result.message_id.toString(),
        cost: 0, // Telegram бесплатный
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Telegram send error:', error);
      return {
        messageId: request.messageId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getBotInfo(): Promise<any> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data.result;
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      }),
    });

    const data = await response.json();
    return data.ok;
  }
}
