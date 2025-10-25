import { Controller, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('telegram')
  @ApiOperation({ summary: 'Telegram Bot webhook' })
  async telegram(@Body() body: any) {
    return this.webhooksService.handleTelegram(body);
  }

  @Post('vk')
  @ApiOperation({ summary: 'VK Callback API webhook' })
  async vk(@Body() body: any) {
    return this.webhooksService.handleVK(body);
  }

  @Post('email/mailgun')
  @ApiOperation({ summary: 'Mailgun webhook' })
  async mailgun(@Body() body: any) {
    return this.webhooksService.handleMailgun(body);
  }

  @Post('email/sendgrid')
  @ApiOperation({ summary: 'SendGrid webhook' })
  async sendgrid(@Body() body: any[]) {
    return this.webhooksService.handleSendGrid(body);
  }

  @Post('sms')
  @ApiOperation({ summary: 'SMS DLR webhook' })
  async sms(@Body() body: any) {
    return this.webhooksService.handleSMS(body);
  }

  @Post('crm')
  @ApiOperation({ summary: 'CRM events (trial_booked, trial_attended)' })
  async crm(@Body() body: any) {
    return this.webhooksService.handleCRM(body);
  }
}

