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
export class EmailConnector {
  private provider: 'mailgun' | 'sendgrid';
  private apiKey: string;
  private domain: string;
  private fromEmail: string;

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as 'mailgun' | 'sendgrid') || 'mailgun';
    this.apiKey = process.env.MAILGUN_API_KEY || process.env.SENDGRID_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@algoritmika.org';
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      if (!request.recipient.email) {
        throw new Error('Email address not provided');
      }

      if (!this.apiKey) {
        throw new Error('Email provider API key not configured');
      }

      let result: any;

      if (this.provider === 'mailgun') {
        result = await this.sendViaMailgun(request);
      } else {
        result = await this.sendViaSendgrid(request);
      }

      return {
        messageId: request.messageId,
        status: 'sent',
        providerMessageId: result.id,
        cost: 0.001, // Примерная стоимость email
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        messageId: request.messageId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async sendViaMailgun(request: SendMessageRequest): Promise<any> {
    const formData = new FormData();
    formData.append('from', this.fromEmail);
    formData.append('to', request.recipient.email!);
    formData.append('subject', 'Сообщение от Algoritmika');
    formData.append('text', request.content);
    formData.append('html', request.content.replace(/\n/g, '<br>'));

    const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun API error: ${error}`);
    }

    return await response.json();
  }

  private async sendViaSendgrid(request: SendMessageRequest): Promise<any> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: request.recipient.email! }],
          },
        ],
        from: { email: this.fromEmail },
        subject: 'Сообщение от Algoritmika',
        content: [
          {
            type: 'text/html',
            value: request.content.replace(/\n/g, '<br>'),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    return { id: Date.now().toString() };
  }
}
