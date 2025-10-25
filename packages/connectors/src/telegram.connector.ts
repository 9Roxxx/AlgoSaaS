import axios from 'axios';
import { MessageStatus } from '@algor/db';
import { IChannelConnector, SendMessagePayload, SendResult } from './interfaces';

export class TelegramConnector implements IChannelConnector {
  private botToken: string;
  private apiUrl: string;

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  validateRecipient(recipient: SendMessagePayload['recipient']): boolean {
    return !!recipient.tgId;
  }

  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.validateRecipient(payload.recipient)) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'INVALID_RECIPIENT',
        errorMessage: 'Telegram ID is required',
      };
    }

    if (!this.botToken) {
      // Stub mode для разработки
      console.log('[TG STUB] Would send:', {
        to: payload.recipient.tgId,
        text: payload.content,
      });
      return {
        success: true,
        providerMessageId: `tg_stub_${Date.now()}`,
        status: MessageStatus.SENT,
      };
    }

    try {
      // Реальная отправка через Telegram Bot API
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: payload.recipient.tgId,
        text: payload.content,
        parse_mode: 'HTML',
      });

      return {
        success: true,
        providerMessageId: String(response.data.result.message_id),
        status: MessageStatus.SENT,
      };
    } catch (error: any) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: error.response?.data?.error_code || 'TELEGRAM_ERROR',
        errorMessage: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Парсинг webhook от Telegram
   */
  static parseWebhook(body: any): {
    type: 'message' | 'start' | 'stop';
    userId: string;
    text?: string;
  } | null {
    if (!body.message) return null;

    const message = body.message;
    const text = message.text || '';
    const userId = String(message.from.id);

    if (text.startsWith('/start')) {
      return { type: 'start', userId };
    }

    if (text.toLowerCase().includes('стоп') || text.toLowerCase().includes('stop')) {
      return { type: 'stop', userId, text };
    }

    return { type: 'message', userId, text };
  }
}

