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
export class WhatsAppConnector {
  private bspEnabled: boolean;
  private bspUrl: string;
  private bspToken: string;

  constructor() {
    this.bspEnabled = process.env.WHATSAPP_BSP_ENABLED === 'true';
    this.bspUrl = process.env.WHATSAPP_BSP_URL || '';
    this.bspToken = process.env.WHATSAPP_BSP_TOKEN || '';
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      if (!request.recipient.phone) {
        throw new Error('Phone number not provided');
      }

      const phone = this.normalizePhone(request.recipient.phone);

      if (this.bspEnabled) {
        return await this.sendViaBSP(request, phone);
      } else {
        return await this.sendViaClickToWhatsApp(request, phone);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        messageId: request.messageId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async sendViaBSP(request: SendMessageRequest, phone: string): Promise<SendMessageResult> {
    if (!this.bspUrl || !this.bspToken) {
      throw new Error('WhatsApp BSP not configured');
    }

    const response = await fetch(`${this.bspUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.bspToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        type: 'text',
        text: {
          body: request.content,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`WhatsApp BSP error: ${data.error?.message || 'Unknown error'}`);
    }

    return {
      messageId: request.messageId,
      status: 'sent',
      providerMessageId: data.messages[0]?.id,
      cost: 0.01, // Примерная стоимость WhatsApp BSP
      timestamp: new Date().toISOString(),
    };
  }

  private async sendViaClickToWhatsApp(request: SendMessageRequest, phone: string): Promise<SendMessageResult> {
    // Click-to-WhatsApp не отправляет сообщения напрямую
    // Вместо этого создает ссылку для пользователя
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(request.content)}`;

    // В реальной системе здесь можно:
    // 1. Сохранить ссылку в БД
    // 2. Отправить пользователю через другой канал (SMS, Email)
    // 3. Показать QR-код с ссылкой

    return {
      messageId: request.messageId,
      status: 'sent',
      providerMessageId: whatsappUrl,
      cost: 0, // Click-to-WhatsApp бесплатный
      timestamp: new Date().toISOString(),
    };
  }

  private normalizePhone(phone: string): string {
    // Убираем все символы кроме цифр
    let normalized = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на 7
    if (normalized.startsWith('8')) {
      normalized = '7' + normalized.substring(1);
    }
    
    // Если номер начинается с 7, оставляем как есть
    if (!normalized.startsWith('7')) {
      normalized = '7' + normalized;
    }
    
    return normalized;
  }

  async getClickToWhatsAppLink(phone: string, message: string): Promise<string> {
    const normalizedPhone = this.normalizePhone(phone);
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }
}
