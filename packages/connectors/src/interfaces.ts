import { Channel, MessageStatus } from '@algor/db';

export interface SendMessagePayload {
  messageId: string;
  channel: Channel;
  recipient: {
    phone?: string;
    email?: string;
    tgId?: string;
    vkUserId?: string;
  };
  content: string;
  variables?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  status: MessageStatus;
  errorCode?: string;
  errorMessage?: string;
}

export interface IChannelConnector {
  send(payload: SendMessagePayload): Promise<SendResult>;
  validateRecipient(recipient: SendMessagePayload['recipient']): boolean;
}

export interface WebhookEvent {
  channel: Channel;
  providerMessageId: string;
  status: MessageStatus;
  timestamp: Date;
  metadata?: Record<string, any>;
}

