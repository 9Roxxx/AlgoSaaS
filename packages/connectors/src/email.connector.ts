import axios from 'axios';
import { MessageStatus } from '@algor/db';
import { IChannelConnector, SendMessagePayload, SendResult } from './interfaces';

type EmailProvider = 'mailgun' | 'sendgrid';

export class EmailConnector implements IChannelConnector {
  private provider: EmailProvider;
  private apiKey: string;
  private domain?: string;
  private fromEmail: string;

  constructor(provider?: EmailProvider) {
    this.provider = provider || (process.env.EMAIL_PROVIDER as EmailProvider) || 'mailgun';
    this.apiKey = this.provider === 'mailgun' 
      ? process.env.MAILGUN_API_KEY || ''
      : process.env.SENDGRID_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN;
    this.fromEmail = this.provider === 'mailgun'
      ? process.env.MAILGUN_FROM_EMAIL || 'noreply@algoritmika.org'
      : process.env.SENDGRID_FROM_EMAIL || 'noreply@algoritmika.org';
  }

  validateRecipient(recipient: SendMessagePayload['recipient']): boolean {
    return !!recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email);
  }

  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.validateRecipient(payload.recipient)) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'INVALID_RECIPIENT',
        errorMessage: 'Valid email is required',
      };
    }

    if (!this.apiKey) {
      // Stub mode
      console.log(`[EMAIL STUB - ${this.provider.toUpperCase()}] Would send:`, {
        to: payload.recipient.email,
        subject: 'Алгоритмика',
        body: payload.content.substring(0, 100) + '...',
      });
      return {
        success: true,
        providerMessageId: `email_stub_${Date.now()}`,
        status: MessageStatus.SENT,
      };
    }

    if (this.provider === 'mailgun') {
      return this.sendViaMailgun(payload);
    } else {
      return this.sendViaSendGrid(payload);
    }
  }

  private async sendViaMailgun(payload: SendMessagePayload): Promise<SendResult> {
    try {
      const formData = new URLSearchParams();
      formData.append('from', this.fromEmail);
      formData.append('to', payload.recipient.email!);
      formData.append('subject', 'Алгоритмика - школа программирования для детей');
      formData.append('html', payload.content);
      formData.append('o:tag', `message_${payload.messageId}`);
      formData.append('o:tracking', 'yes');
      formData.append('o:tracking-clicks', 'yes');
      formData.append('o:tracking-opens', 'yes');

      const response = await axios.post(
        `https://api.mailgun.net/v3/${this.domain}/messages`,
        formData,
        {
          auth: {
            username: 'api',
            password: this.apiKey,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        providerMessageId: response.data.id,
        status: MessageStatus.SENT,
      };
    } catch (error: any) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'MAILGUN_ERROR',
        errorMessage: error.response?.data?.message || error.message,
      };
    }
  }

  private async sendViaSendGrid(payload: SendMessagePayload): Promise<SendResult> {
    try {
      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: [{ email: payload.recipient.email }],
              custom_args: {
                message_id: payload.messageId,
              },
            },
          ],
          from: { email: this.fromEmail },
          subject: 'Алгоритмика - школа программирования для детей',
          content: [
            {
              type: 'text/html',
              value: payload.content,
            },
          ],
          tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messageId = response.headers['x-message-id'] || `sg_${Date.now()}`;
      return {
        success: true,
        providerMessageId: messageId,
        status: MessageStatus.SENT,
      };
    } catch (error: any) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'SENDGRID_ERROR',
        errorMessage: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Парсинг webhook от Mailgun
   */
  static parseMailgunWebhook(body: any): {
    event: 'delivered' | 'opened' | 'clicked' | 'complained' | 'failed';
    messageId: string;
    timestamp: Date;
  } | null {
    const eventData = body['event-data'];
    if (!eventData) return null;

    const messageId = eventData.tags?.[0]?.replace('message_', '') || eventData['message-id'];
    
    return {
      event: eventData.event as any,
      messageId,
      timestamp: new Date(eventData.timestamp * 1000),
    };
  }

  /**
   * Парсинг webhook от SendGrid
   */
  static parseSendGridWebhook(events: any[]): Array<{
    event: 'delivered' | 'open' | 'click' | 'spamreport' | 'bounce';
    messageId: string;
    timestamp: Date;
  }> {
    return events.map((event) => ({
      event: event.event,
      messageId: event.message_id,
      timestamp: new Date(event.timestamp * 1000),
    }));
  }
}

