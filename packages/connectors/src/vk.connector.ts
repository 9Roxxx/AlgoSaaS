import axios from 'axios';
import { MessageStatus } from '@algor/db';
import { IChannelConnector, SendMessagePayload, SendResult } from './interfaces';

export class VKConnector implements IChannelConnector {
  private accessToken: string;
  private apiVersion: string = '5.131';

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.VK_ACCESS_TOKEN || '';
  }

  validateRecipient(recipient: SendMessagePayload['recipient']): boolean {
    return !!recipient.vkUserId;
  }

  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.validateRecipient(payload.recipient)) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'INVALID_RECIPIENT',
        errorMessage: 'VK user ID is required',
      };
    }

    if (!this.accessToken) {
      // Stub mode
      console.log('[VK STUB] Would send:', {
        to: payload.recipient.vkUserId,
        text: payload.content,
      });
      return {
        success: true,
        providerMessageId: `vk_stub_${Date.now()}`,
        status: MessageStatus.SENT,
      };
    }

    try {
      // Отправка через VK API (messages.send)
      const response = await axios.post('https://api.vk.com/method/messages.send', null, {
        params: {
          user_id: payload.recipient.vkUserId,
          message: payload.content,
          random_id: Math.floor(Math.random() * 1000000000),
          access_token: this.accessToken,
          v: this.apiVersion,
        },
      });

      if (response.data.error) {
        return {
          success: false,
          status: MessageStatus.UNDELIVERED,
          errorCode: `VK_${response.data.error.error_code}`,
          errorMessage: response.data.error.error_msg,
        };
      }

      return {
        success: true,
        providerMessageId: String(response.data.response),
        status: MessageStatus.SENT,
      };
    } catch (error: any) {
      return {
        success: false,
        status: MessageStatus.UNDELIVERED,
        errorCode: 'VK_ERROR',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Парсинг Callback API от VK
   */
  static parseWebhook(body: any): {
    type: 'message_new' | 'group_join' | 'confirmation';
    userId?: string;
    text?: string;
  } | null {
    if (body.type === 'confirmation') {
      return { type: 'confirmation' };
    }

    if (body.type === 'message_new') {
      const message = body.object.message;
      return {
        type: 'message_new',
        userId: String(message.from_id),
        text: message.text,
      };
    }

    if (body.type === 'group_join') {
      return {
        type: 'group_join',
        userId: String(body.object.user_id),
      };
    }

    return null;
  }
}

