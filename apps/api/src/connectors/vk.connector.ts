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
export class VKConnector {
  private accessToken: string;
  private groupId: string;

  constructor() {
    this.accessToken = process.env.VK_ACCESS_TOKEN || '';
    this.groupId = process.env.VK_GROUP_ID || '';
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      if (!request.recipient.vkUserId) {
        throw new Error('VK user ID not provided');
      }

      if (!this.accessToken) {
        throw new Error('VK access token not configured');
      }

      // Реальная отправка через VK API
      const response = await fetch('https://api.vk.com/method/messages.send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          access_token: this.accessToken,
          v: '5.131',
          user_id: request.recipient.vkUserId,
          message: request.content,
          random_id: Math.floor(Math.random() * 1000000).toString(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`VK API error: ${data.error.error_msg}`);
      }

      return {
        messageId: request.messageId,
        status: 'sent',
        providerMessageId: data.response.toString(),
        cost: 0, // VK бесплатный
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('VK send error:', error);
      return {
        messageId: request.messageId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getGroupInfo(): Promise<any> {
    if (!this.accessToken || !this.groupId) {
      throw new Error('VK access token or group ID not configured');
    }

    try {
      const response = await fetch('https://api.vk.com/method/groups.getById', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          access_token: this.accessToken,
          v: '5.131',
          group_id: this.groupId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`VK API error: ${data.error.error_msg}`);
      }

      return data.response[0];
    } catch (error) {
      console.error('VK group info error:', error);
      throw error;
    }
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.accessToken || !this.groupId) {
      throw new Error('VK access token or group ID not configured');
    }

    try {
      const response = await fetch('https://api.vk.com/method/groups.setCallbackServer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          access_token: this.accessToken,
          v: '5.131',
          group_id: this.groupId,
          server_url: webhookUrl,
        }),
      });

      const data = await response.json();
      return !data.error;
    } catch (error) {
      console.error('VK webhook error:', error);
      return false;
    }
  }
}
