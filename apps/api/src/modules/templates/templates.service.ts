import { Injectable } from '@nestjs/common';
import { prisma, Channel, TemplateStatus, TemplateCategory } from '@algor/db';
import { TemplateRenderer } from '@algor/connectors';
import { CreateTemplateDto } from './dto';

@Injectable()
export class TemplatesService {
  async list(tenantId: string, channel?: Channel) {
    return prisma.template.findMany({
      where: {
        tenantId,
        channel,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateTemplateDto) {
    return prisma.template.create({
      data: {
        tenantId,
        channel: dto.channel as Channel,
        name: dto.name,
        body: dto.body,
        variables: dto.variables || [],
        status: (dto.status as TemplateStatus) || 'DRAFT',
        category: (dto.category as TemplateCategory) || 'VALUE_FIRST',
      },
    });
  }

  async render(tenantId: string, templateId: string, variables: Record<string, any>) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const rendered = await TemplateRenderer.render(template.body, variables);

    return {
      templateId: template.id,
      rendered,
    };
  }

  async getTemplate(tenantId: string, templateId: string) {
    return prisma.template.findFirst({
      where: { id: templateId, tenantId },
    });
  }
}

