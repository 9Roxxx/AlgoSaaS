import { Injectable } from '@nestjs/common';
import { prisma, MessageStatus } from '@algor/db';

@Injectable()
export class RedirectService {
  async trackAndRedirect(messageId: string, slug: string): Promise<string | null> {
    // Найти сообщение
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        campaign: true,
        contact: true,
      },
    });

    if (!message) {
      return null;
    }

    // Определить целевой URL (можно хранить в payload или campaign)
    const targetUrl = (message.payload as any)?.targetUrl || 'https://algoritmika.org';

    // Записать клик
    await prisma.clickEvent.create({
      data: {
        tenantId: message.tenantId,
        contactId: message.contactId,
        campaignId: message.campaignId,
        messageId: message.id,
        url: targetUrl,
      },
    });

    // Обновить статус сообщения
    if (message.status !== MessageStatus.CLICKED) {
      await prisma.message.update({
        where: { id: message.id },
        data: { status: MessageStatus.CLICKED },
      });

      await prisma.delivery.updateMany({
        where: { messageId: message.id },
        data: {
          status: MessageStatus.CLICKED,
          clickedAt: new Date(),
        },
      });
    }

    return targetUrl;
  }
}

