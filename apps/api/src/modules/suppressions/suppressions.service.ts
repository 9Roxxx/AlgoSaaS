import { Injectable } from '@nestjs/common';
import { prisma, Channel } from '@algor/db';
import { CreateSuppressionDto } from './dto';

@Injectable()
export class SuppressionsService {
  async create(tenantId: string, dto: CreateSuppressionDto) {
    // Создать запись Suppress
    const suppression = await prisma.suppress.create({
      data: {
        tenantId,
        contactId: dto.contactId,
        channel: dto.channel ? (dto.channel as Channel) : null,
        reason: dto.reason,
      },
    });

    return suppression;
  }

  async list(tenantId: string, contactId?: string) {
    return prisma.suppress.findMany({
      where: {
        tenantId,
        contactId,
      },
      include: {
        contact: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(tenantId: string, suppressionId: string) {
    return prisma.suppress.delete({
      where: { id: suppressionId, tenantId },
    });
  }

  async isSuppressed(
    tenantId: string,
    contactId: string,
    channel?: Channel,
  ): Promise<boolean> {
    const suppression = await prisma.suppress.findFirst({
      where: {
        tenantId,
        contactId,
        OR: [{ channel: null }, { channel }],
      },
    });
    return !!suppression;
  }

  /**
   * Глобальная отписка по ключевым словам СТОП/STOP/ОТПИСКА
   */
  async globalUnsubscribe(tenantId: string, contactId: string) {
    return this.create(tenantId, {
      contactId,
      channel: null,
      reason: 'keyword_stop',
    });
  }
}

