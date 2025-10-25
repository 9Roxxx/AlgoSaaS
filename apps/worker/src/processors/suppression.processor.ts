import { Job } from 'bullmq';
import { prisma } from '@algor/db';

interface SuppressionJob {
  tenantId: string;
  contactId: string;
  channel?: string | null;
  reason: string;
}

export async function suppressionProcessor(job: Job<SuppressionJob>) {
  const { tenantId, contactId, channel, reason } = job.data;

  console.log(`🚫 Processing suppression for contact ${contactId}`);

  // Создать запись Suppress
  await prisma.suppress.create({
    data: {
      tenantId,
      contactId,
      channel: channel as any,
      reason,
    },
  });

  // Отозвать все активные согласия для данного канала (если channel != null)
  if (channel) {
    await prisma.consent.updateMany({
      where: {
        tenantId,
        contactId,
        channel: channel as any,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } else {
    // Глобальная отписка - отозвать все согласия
    await prisma.consent.updateMany({
      where: {
        tenantId,
        contactId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  console.log(`✅ Suppression processed for contact ${contactId}`);

  return { success: true };
}

