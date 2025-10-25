import { Injectable } from '@nestjs/common';
import { prisma, MessageStatus } from '@algor/db';
import { TelegramConnector, VKConnector, EmailConnector, SMSConnector } from '@algor/connectors';
import { isUnsubscribeKeyword } from '@algor/shared';
import { SuppressionsService } from '../suppressions/suppressions.service';

@Injectable()
export class WebhooksService {
  constructor(private suppressionsService: SuppressionsService) {}

  async handleTelegram(body: any) {
    const parsed = TelegramConnector.parseWebhook(body);
    if (!parsed) return { ok: true };

    const { type, userId, text } = parsed;

    // Найти контакт
    const contact = await prisma.contact.findFirst({
      where: { tgId: userId },
    });

    if (!contact) {
      // Новый пользователь
      if (type === 'start') {
        console.log('New Telegram user:', userId);
        // Здесь можно создать контакт и согласие
      }
      return { ok: true };
    }

    // Обработка /start - создать согласие
    if (type === 'start') {
      await prisma.consent.upsert({
        where: {
          tenantId_contactId_channel_scope: {
            tenantId: contact.tenantId,
            contactId: contact.id,
            channel: 'TELEGRAM',
            scope: 'PROMO',
          },
        },
        update: {},
        create: {
          tenantId: contact.tenantId,
          contactId: contact.id,
          channel: 'TELEGRAM',
          scope: 'PROMO',
          source: 'TG_START',
          policyVersion: '2024-01',
        },
      });
    }

    // Обработка СТОП
    if (type === 'stop' || (text && isUnsubscribeKeyword(text))) {
      await this.suppressionsService.globalUnsubscribe(contact.tenantId, contact.id);
    }

    return { ok: true };
  }

  async handleVK(body: any) {
    const parsed = VKConnector.parseWebhook(body);
    if (!parsed) return { ok: true };

    if (parsed.type === 'confirmation') {
      // Возврат confirmation string для VK
      return process.env.VK_CONFIRMATION_CODE || 'ok';
    }

    if (parsed.type === 'group_join' && parsed.userId) {
      // Подписка на сообщество - создать контакт и согласие
      console.log('VK group join:', parsed.userId);
    }

    if (parsed.type === 'message_new' && parsed.text) {
      // Проверка на СТОП
      if (isUnsubscribeKeyword(parsed.text)) {
        const contact = await prisma.contact.findFirst({
          where: { vkUserId: parsed.userId },
        });
        if (contact) {
          await this.suppressionsService.globalUnsubscribe(contact.tenantId, contact.id);
        }
      }
    }

    return { ok: true };
  }

  async handleMailgun(body: any) {
    const parsed = EmailConnector.parseMailgunWebhook(body);
    if (!parsed) return { ok: true };

    const { event, messageId } = parsed;

    // Найти сообщение
    const message = await prisma.message.findFirst({
      where: { id: messageId },
    });

    if (!message) return { ok: true };

    // Обновить статус
    let status: MessageStatus = message.status;
    const updates: any = {};

    if (event === 'delivered') {
      status = MessageStatus.DELIVERED;
      updates.deliveredAt = new Date();
    } else if (event === 'opened') {
      status = MessageStatus.READ;
      updates.readAt = new Date();
    } else if (event === 'clicked') {
      status = MessageStatus.CLICKED;
      updates.clickedAt = new Date();
    } else if (event === 'complained') {
      status = MessageStatus.COMPLAINT;
      updates.complaintAt = new Date();
    } else if (event === 'failed') {
      status = MessageStatus.UNDELIVERED;
    }

    await prisma.delivery.update({
      where: { messageId: message.id },
      data: {
        status,
        ...updates,
      },
    });

    await prisma.message.update({
      where: { id: message.id },
      data: { status },
    });

    return { ok: true };
  }

  async handleSendGrid(events: any[]) {
    for (const event of events) {
      const messageId = event.message_id;
      const message = await prisma.message.findFirst({
        where: { id: messageId },
      });

      if (!message) continue;

      let status: MessageStatus = message.status;
      const updates: any = {};

      if (event.event === 'delivered') {
        status = MessageStatus.DELIVERED;
        updates.deliveredAt = new Date(event.timestamp * 1000);
      } else if (event.event === 'open') {
        status = MessageStatus.READ;
        updates.readAt = new Date(event.timestamp * 1000);
      } else if (event.event === 'click') {
        status = MessageStatus.CLICKED;
        updates.clickedAt = new Date(event.timestamp * 1000);
      } else if (event.event === 'spamreport') {
        status = MessageStatus.COMPLAINT;
        updates.complaintAt = new Date(event.timestamp * 1000);
      }

      await prisma.delivery.update({
        where: { messageId: message.id },
        data: { status, ...updates },
      });

      await prisma.message.update({
        where: { id: message.id },
        data: { status },
      });
    }

    return { ok: true };
  }

  async handleSMS(body: any) {
    const parsed = SMSConnector.parseDLRWebhook(body);
    if (!parsed) return { ok: true };

    const { messageId, status } = parsed;

    const message = await prisma.message.findFirst({
      where: { id: messageId },
    });

    if (!message) return { ok: true };

    const messageStatus = status === 'delivered' ? MessageStatus.DELIVERED : MessageStatus.UNDELIVERED;

    await prisma.delivery.update({
      where: { messageId: message.id },
      data: {
        status: messageStatus,
        deliveredAt: status === 'delivered' ? new Date() : null,
      },
    });

    await prisma.message.update({
      where: { id: message.id },
      data: { status: messageStatus },
    });

    return { ok: true };
  }

  async handleCRM(body: any) {
    // Пример: { event: 'trial_booked', contactId: 'xxx', campaignId: 'yyy', ... }
    const { event, contactId, campaignId, ...payload } = body;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) return { ok: false, error: 'Contact not found' };

    // Записать Lead Event
    await prisma.leadEvent.create({
      data: {
        tenantId: contact.tenantId,
        contactId,
        campaignId: campaignId || null,
        payload: { event, ...payload },
      },
    });

    // Обновить interests контакта
    if (event === 'trial_booked') {
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          interests: {
            ...(contact.interests as any),
            trialBooked: true,
          },
        },
      });
    }

    return { ok: true };
  }
}

