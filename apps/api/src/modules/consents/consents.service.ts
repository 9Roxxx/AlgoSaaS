import { Injectable } from '@nestjs/common';
import { prisma, Channel, ConsentScope, ConsentSource } from '@algor/db';
import { CreateConsentDto } from './dto';

@Injectable()
export class ConsentsService {
  async create(tenantId: string, dto: CreateConsentDto) {
    return prisma.consent.create({
      data: {
        tenantId,
        contactId: dto.contactId,
        channel: dto.channel as Channel,
        scope: dto.scope as ConsentScope,
        source: dto.source as ConsentSource,
        policyVersion: dto.policyVersion,
        proofUrl: dto.proofUrl,
      },
    });
  }

  async list(tenantId: string, contactId?: string) {
    return prisma.consent.findMany({
      where: {
        tenantId,
        contactId,
        revokedAt: null,
      },
      include: {
        contact: {
          select: {
            id: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(tenantId: string, consentId: string) {
    return prisma.consent.update({
      where: { id: consentId, tenantId },
      data: { revokedAt: new Date() },
    });
  }

  async hasConsent(
    tenantId: string,
    contactId: string,
    channel: Channel,
    scope: ConsentScope,
  ): Promise<boolean> {
    const consent = await prisma.consent.findFirst({
      where: {
        tenantId,
        contactId,
        channel,
        scope,
        revokedAt: null,
      },
    });
    return !!consent;
  }
}

