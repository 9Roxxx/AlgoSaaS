import { Injectable } from '@nestjs/common';
import { prisma } from '@algor/db';
import { CreateSegmentDto } from './dto';

@Injectable()
export class SegmentsService {
  async list(tenantId: string) {
    return prisma.segment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateSegmentDto) {
    return prisma.segment.create({
      data: {
        tenantId,
        name: dto.name,
        filterDsl: dto.filterDsl,
      },
    });
  }

  async preview(tenantId: string, segmentId: string) {
    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    // Парсим фильтр DSL (JSON)
    const filter = JSON.parse(segment.filterDsl);

    // Строим where условие для Prisma
    const where: any = { tenantId };

    if (filter.city) {
      where.city = filter.city;
    }

    if (filter.childAge) {
      where.childAge = filter.childAge;
    }

    if (filter['interests.trialBooked'] !== undefined) {
      where.interests = {
        path: ['trialBooked'],
        equals: filter['interests.trialBooked'],
      };
    }

    const contacts = await prisma.contact.findMany({
      where,
      take: 10,
      select: {
        id: true,
        phone: true,
        email: true,
        city: true,
        childAge: true,
      },
    });

    const total = await prisma.contact.count({ where });

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      total,
      preview: contacts,
    };
  }

  async evaluateSegment(tenantId: string, segmentId: string): Promise<string[]> {
    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      return [];
    }

    const filter = JSON.parse(segment.filterDsl);
    const where: any = { tenantId };

    if (filter.city) where.city = filter.city;
    if (filter.childAge) where.childAge = filter.childAge;
    if (filter['interests.trialBooked'] !== undefined) {
      where.interests = {
        path: ['trialBooked'],
        equals: filter['interests.trialBooked'],
      };
    }

    const contacts = await prisma.contact.findMany({
      where,
      select: { id: true },
    });

    return contacts.map((c) => c.id);
  }
}

