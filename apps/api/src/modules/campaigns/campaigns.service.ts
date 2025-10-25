import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { prisma, CampaignStatus, MessageStatus } from '@algor/db';
import { CreateCampaignDto, StartCampaignDto } from './dto';
import { CampaignMetrics } from '@algor/shared';

@Injectable()
export class CampaignsService {
  constructor(
    @Inject('CAMPAIGN_DISPATCH_QUEUE') private campaignQueue: Queue,
  ) {}

  async list(tenantId: string) {
    return prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateCampaignDto) {
    return prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name,
        channelPolicy: dto.channelPolicy || {},
        status: 'DRAFT',
      },
    });
  }

  async start(tenantId: string, campaignId: string, dto: StartCampaignDto) {
    // Обновить статус
    const campaign = await prisma.campaign.update({
      where: { id: campaignId, tenantId },
      data: {
        status: 'RUNNING',
        startAt: new Date(),
      },
    });

    // Добавить в очередь на обработку
    await this.campaignQueue.add('dispatch-campaign', {
      tenantId,
      campaignId,
      segmentId: dto.segmentId,
      templateIds: dto.templateIds,
      waveSize: dto.waveSize || 1000,
    });

    return campaign;
  }

  async pause(tenantId: string, campaignId: string) {
    return prisma.campaign.update({
      where: { id: campaignId, tenantId },
      data: { status: 'PAUSED' },
    });
  }

  async stop(tenantId: string, campaignId: string) {
    return prisma.campaign.update({
      where: { id: campaignId, tenantId },
      data: {
        status: 'STOPPED',
        completedAt: new Date(),
      },
    });
  }

  async getMetrics(tenantId: string, campaignId: string): Promise<CampaignMetrics> {
    const messages = await prisma.message.groupBy({
      by: ['status'],
      where: {
        tenantId,
        campaignId,
      },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    let total = 0;

    messages.forEach((m) => {
      statusCounts[m.status] = m._count;
      total += m._count;
    });

    const sent = statusCounts[MessageStatus.SENT] || 0;
    const delivered = statusCounts[MessageStatus.DELIVERED] || 0;
    const read = statusCounts[MessageStatus.READ] || 0;
    const clicked = statusCounts[MessageStatus.CLICKED] || 0;
    const undelivered = statusCounts[MessageStatus.UNDELIVERED] || 0;
    const complaints = statusCounts[MessageStatus.COMPLAINT] || 0;

    return {
      total,
      queued: statusCounts[MessageStatus.QUEUED] || 0,
      sent,
      delivered,
      read,
      clicked,
      undelivered,
      complaints,
      suppressed: statusCounts[MessageStatus.SUPPRESSED] || 0,
      deliveryRate: sent > 0 ? delivered / sent : 0,
      readRate: delivered > 0 ? read / delivered : 0,
      clickRate: delivered > 0 ? clicked / delivered : 0,
      complaintRate: sent > 0 ? complaints / sent : 0,
    };
  }
}

