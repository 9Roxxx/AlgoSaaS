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
export class SMSConnector {
  private providerUrl: string;
  private apiKey: string;

  constructor() {
    this.providerUrl = process.env.SMS_PROVIDER_URL || '';
    this.apiKey = process.env.SMS_PROVIDER_API_KEY || '';
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      if (!request.recipient.phone) {
        throw new Error('Phone number not provided');
      }

      if (!this.providerUrl || !this.apiKey) {
        throw new Error('SMS provider not configured');
      }

      // Нормализация номера телефона
      const phone = this.normalizePhone(request.recipient.phone);

      // Реальная отправка через SMS провайдера
      const response = await fetch(this.providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          message: request.content,
          sender: 'Algoritmika',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`SMS API error: ${data.error || 'Unknown error'}`);
      }

      return {
        messageId: request.messageId,
        status: 'sent',
        providerMessageId: data.messageId || data.id,
        cost: 0.05, // Примерная стоимость SMS
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        messageId: request.messageId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private normalizePhone(phone: string): string {
    // Убираем все символы кроме цифр
    let normalized = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на +7
    if (normalized.startsWith('8')) {
      normalized = '7' + normalized.substring(1);
    }
    
    // Если номер начинается с 7, добавляем +
    if (normalized.startsWith('7')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  async getBalance(): Promise<number> {
    if (!this.providerUrl || !this.apiKey) {
      throw new Error('SMS provider not configured');
    }

    try {
      const response = await fetch(`${this.providerUrl}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('SMS balance error:', error);
      return 0;
    }
  }
}
