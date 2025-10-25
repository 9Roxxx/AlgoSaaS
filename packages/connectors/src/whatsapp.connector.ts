import axios from 'axios';
import { MessageStatus } from '@algor/db';
import { generateWhatsAppLink } from '@algor/shared';
import { IChannelConnector, SendMessagePayload, SendResult } from './interfaces';

type WhatsAppMode = 'click_to_wa' | 'waba' | 'hybrid';

export class WhatsAppConnector implements IChannelConnector {
  private mode: WhatsAppMode;
  private bspUrl?: string;
  private bspToken?: string;
  private bspEnabled: boolean;

  constructor(mode?: WhatsAppMode) {
    this.mode = mode || 'click_to_wa';
    this.bspEnabled = process.env.WHATSAPP_BSP_ENABLED === 'true';
    this.bspUrl = process.env.WHATSAPP_BSP_URL;
    this.bspToken = process.env.WHATSAPP_BSP_TOKEN;
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
        errorMessage: 'Valid phone number is required',
      };
    }

    // Режим Click-to-WhatsApp - мы не отправляем, а генерируем ссылку
    if (this.mode === 'click_to_wa' || (this.mode === 'hybrid' && !this.bspEnabled)) {
      const waLink = generateWhatsAppLink(payload.recipient.phone!, payload.content);
      
      console.log('[WA Click-to-WA] Generated link:', {
        phone: payload.recipient.phone,
        link: waLink,
      });

      // В этом режиме мы возвращаем ссылку в metadata,
      // и она будет вставлена в другие каналы (TG/VK/Email/SMS)
      return {
        success: true,
        providerMessageId: `wa_c2wa_${Date.now()}`,
        status: MessageStatus.SENT, // Технически "отправлено" как ссылка
      };
    }

    // Режим WABA (WhatsApp Business API) через BSP
    if (this.mode === 'waba' || (this.mode === 'hybrid' && this.bspEnabled)) {
      return this.sendViaWABA(payload);
    }

    return {
      success: false,
      status: MessageStatus.UNDELIVERED,
      errorCode: 'INVALID_MODE',
      errorMessage: 'WhatsApp mode not configured',
    };
  }

  /**
   * Отправка через WhatsApp Business API (требует BSP провайдера)
   */
  private async sendViaWABA(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.bspUrl || !this.bspToken) {
      console.log('[WA WABA STUB] Would send via BSP:', {
        to: payload.recipient.phone,
        text: payload.content.substring(0, 100) + '...',
      });
      return {
        success: true,
        providerMessageId: `wa_waba_stub_${Date.now()}`,
        status: MessageStatus.SENT,
      };
    }

    try {
      // Пример интеграции с BSP (360dialog, Twilio, GreenAPI, etc)
      // ВАЖНО: для WABA требуются только pre-approved шаблоны!
      const response = await axios.post(
        `${this.bspUrl}/messages`,
        {
          to: payload.recipient.phone,
          type: 'template', // WABA требует шаблоны
          template: {
            name: payload.variables?.template_name,
            language: { code: 'ru' },
            components: [
              {
                type: 'body',
                parameters: payload.variables?.template_params || [],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.bspToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        providerMessageId: response.data.messages?.[0]?.id || `wa_${Date.now()}`,
        status: MessageStatus.SENT,
      };
    } catch (error: any) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'WABA_ERROR',
        errorMessage: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Генерация Click-to-WhatsApp ссылки (статический метод)
   */
  static generateClickToWhatsAppLink(phone: string, message?: string): string {
    return generateWhatsAppLink(phone, message);
  }

  /**
   * Парсинг webhook от BSP провайдера
   */
  static parseWABAWebhook(body: any): {
    messageId: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: Date;
  } | null {
    // Формат зависит от BSP, это пример для 360dialog/Twilio
    const status = body.statuses?.[0];
    if (!status) return null;

    return {
      messageId: status.id,
      status: status.status,
      timestamp: new Date(status.timestamp * 1000),
    };
  }
}

