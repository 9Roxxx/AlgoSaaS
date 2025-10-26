import { Injectable } from '@nestjs/common';
import { TelegramConnector } from '../connectors/telegram.connector';
import { EmailConnector } from '../connectors/email.connector';
import { SMSConnector } from '../connectors/sms.connector';
import { VKConnector } from '../connectors/vk.connector';
import { WhatsAppConnector } from '../connectors/whatsapp.connector';

export interface SendMessageRequest {
  messageId: string;
  channel: 'TELEGRAM' | 'VK' | 'EMAIL' | 'SMS' | 'WHATSAPP';
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
export class MessageService {
  private connectors = {
    TELEGRAM: new TelegramConnector(),
    VK: new VKConnector(),
    EMAIL: new EmailConnector(),
    SMS: new SMSConnector(),
    WHATSAPP: new WhatsAppConnector(),
  };

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      const connector = this.connectors[request.channel];
      
      if (!connector) {
        throw new Error(`Connector for channel ${request.channel} not found`);
      }

      // Проверяем тихие часы
      if (this.isQuietHours()) {
        return {
          messageId: request.messageId,
          status: 'failed',
          error: 'Quiet hours - message will be sent later',
          timestamp: new Date().toISOString(),
        };
      }

      // Применяем jitter (случайная задержка)
      await this.applyJitter();

      // Отправляем сообщение
      const result = await connector.send(request);

      // Логируем результат
      console.log(`Message ${request.messageId} sent via ${request.channel}:`, result);

      return result;
    } catch (error) {
      console.error('Message send error:', error);
      return {
        messageId: request.messageId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async sendBulkMessages(requests: SendMessageRequest[]): Promise<SendMessageResult[]> {
    const results: SendMessageResult[] = [];
    
    // Отправляем сообщения с ограничением скорости
    for (const request of requests) {
      const result = await this.sendMessage(request);
      results.push(result);
      
      // Задержка между сообщениями (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  async getChannelStatus(channel: string): Promise<any> {
    const connector = this.connectors[channel];
    
    if (!connector) {
      throw new Error(`Connector for channel ${channel} not found`);
    }

    switch (channel) {
      case 'TELEGRAM':
        return await (connector as TelegramConnector).getBotInfo();
      case 'VK':
        return await (connector as VKConnector).getGroupInfo();
      case 'SMS':
        return { balance: await (connector as SMSConnector).getBalance() };
      default:
        return { status: 'configured' };
    }
  }

  private isQuietHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Тихие часы: 22:00 - 09:00
    return hour >= 22 || hour < 9;
  }

  private async applyJitter(): Promise<void> {
    // Случайная задержка от 1 до 5 секунд
    const delay = Math.random() * 4000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async renderTemplate(template: string, variables: Record<string, any>): Promise<string> {
    // Простой рендеринг шаблона (в реальности используем Liquid.js)
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return rendered;
  }
}
