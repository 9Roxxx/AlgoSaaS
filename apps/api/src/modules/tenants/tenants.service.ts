import { Injectable } from '@nestjs/common';
import { prisma } from '@algor/db';

@Injectable()
export class TenantsService {
  async getTenant(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  }
}

