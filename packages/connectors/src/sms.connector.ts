import axios from 'axios';
import { MessageStatus } from '@algor/db';
import { IChannelConnector, SendMessagePayload, SendResult } from './interfaces';

export class SMSConnector implements IChannelConnector {
  private providerUrl: string;
  private apiKey: string;

  constructor() {
    this.providerUrl = process.env.SMS_PROVIDER_URL || '';
    this.apiKey = process.env.SMS_PROVIDER_API_KEY || '';
  }

  validateRecipient(recipient: SendMessagePayload['recipient']): boolean {
    return !!recipient.phone && /^\+7\d{10}$/.test(recipient.phone);
  }

  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.validateRecipient(payload.recipient)) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'INVALID_RECIPIENT',
        errorMessage: 'Valid phone number is required (+7XXXXXXXXXX)',
      };
    }

    if (!this.providerUrl || !this.apiKey) {
      // Stub mode
      console.log('[SMS STUB] Would send:', {
        to: payload.recipient.phone,
        text: payload.content,
      });
      return {
        success: true,
        providerMessageId: `sms_stub_${Date.now()}`,
        status: MessageStatus.SENT,
      };
    }

    try {
      // Пример интеграции с локальным SMS-агрегатором
      const response = await axios.post(
        this.providerUrl,
        {
          phone: payload.recipient.phone,
          text: payload.content,
          message_id: payload.messageId,
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        providerMessageId: response.data.sms_id || response.data.id,
        status: MessageStatus.SENT,
      };
    } catch (error: any) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'SMS_ERROR',
        errorMessage: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Парсинг DLR (Delivery Report) webhook
   */
  static parseDLRWebhook(body: any): {
    messageId: string;
    status: 'delivered' | 'failed';
    errorCode?: string;
  } | null {
    if (!body.message_id) return null;

    return {
      messageId: body.message_id,
      status: body.status === 'delivered' ? 'delivered' : 'failed',
      errorCode: body.error_code,
    };
  }
}

