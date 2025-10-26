import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { MessageService, SendMessageRequest } from '../services/message.service';

export class SendMessageDto {
  channel: 'TELEGRAM' | 'VK' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  recipient: {
    phone?: string;
    email?: string;
    tgId?: string;
    vkUserId?: string;
  };
  content: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export class BulkSendDto {
  channel: 'TELEGRAM' | 'VK' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  recipients: Array<{
    phone?: string;
    email?: string;
    tgId?: string;
    vkUserId?: string;
  }>;
  content: string;
  templateId?: string;
  variables?: Record<string, any>;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto) {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const request: SendMessageRequest = {
        messageId,
        channel: dto.channel,
        recipient: dto.recipient,
        content: dto.content,
        variables: dto.variables || {},
      };

      const result = await this.messageService.sendMessage(request);

      return {
        success: result.status === 'sent',
        message: result.status === 'sent' ? 'Message sent successfully' : 'Failed to send message',
        result,
      };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  @Post('bulk-send')
  @HttpCode(HttpStatus.OK)
  async bulkSend(@Body() dto: BulkSendDto) {
    try {
      const requests: SendMessageRequest[] = dto.recipients.map((recipient, index) => ({
        messageId: `bulk_${Date.now()}_${index}`,
        channel: dto.channel,
        recipient,
        content: dto.content,
        variables: dto.variables || {},
      }));

      const results = await this.messageService.sendBulkMessages(requests);

      const successCount = results.filter(r => r.status === 'sent').length;
      const failureCount = results.filter(r => r.status === 'failed').length;

      return {
        success: true,
        message: `Bulk send completed: ${successCount} sent, ${failureCount} failed`,
        totalSent: successCount,
        totalFailed: failureCount,
        results,
      };
    } catch (error) {
      console.error('Bulk send error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  @Get('status/:channel')
  async getChannelStatus(@Param('channel') channel: string) {
    try {
      const status = await this.messageService.getChannelStatus(channel.toUpperCase());
      
      return {
        success: true,
        channel: channel.toUpperCase(),
        status,
      };
    } catch (error) {
      console.error('Channel status error:', error);
      return {
        success: false,
        message: 'Failed to get channel status',
        error: error.message,
      };
    }
  }

  @Post('render-template')
  @HttpCode(HttpStatus.OK)
  async renderTemplate(@Body() body: { template: string; variables: Record<string, any> }) {
    try {
      const rendered = await this.messageService.renderTemplate(body.template, body.variables);
      
      return {
        success: true,
        rendered,
        original: body.template,
        variables: body.variables,
      };
    } catch (error) {
      console.error('Template render error:', error);
      return {
        success: false,
        message: 'Failed to render template',
        error: error.message,
      };
    }
  }

  @Get('whatsapp/link')
  async getWhatsAppLink(@Body() body: { phone: string; message: string }) {
    try {
      const { WhatsAppConnector } = await import('../connectors/whatsapp.connector');
      const connector = new WhatsAppConnector();
      const link = await connector.getClickToWhatsAppLink(body.phone, body.message);
      
      return {
        success: true,
        link,
        phone: body.phone,
        message: body.message,
      };
    } catch (error) {
      console.error('WhatsApp link error:', error);
      return {
        success: false,
        message: 'Failed to generate WhatsApp link',
        error: error.message,
      };
    }
  }
}
