import { Job, Queue } from 'bullmq';
import { prisma, Channel } from '@algor/db';
import { generateDedupeKey } from '@algor/shared';
import Redis from 'ioredis';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const sendMessageQueue = new Queue('send-message', { connection: redisConnection });

interface CampaignDispatchJob {
  tenantId: string;
  campaignId: string;
  segmentId: string;
  templateIds: string[];
  waveSize: number;
}

export async function campaignDispatchProcessor(job: Job<CampaignDispatchJob>) {
  const { tenantId, campaignId, segmentId, templateIds, waveSize } = job.data;

  console.log(`📤 Dispatching campaign ${campaignId} for segment ${segmentId}`);

  // 1. Получить контакты из сегмента
  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, tenantId },
  });

  if (!segment) {
    throw new Error('Segment not found');
  }

  // Парсинг фильтра
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
    take: waveSize,
    include: {
      consents: {
        where: { revokedAt: null },
      },
      suppressions: true,
    },
  });

  console.log(`📊 Found ${contacts.length} contacts in segment`);

  // 2. Получить шаблоны
  const templates = await prisma.template.findMany({
    where: {
      id: { in: templateIds },
      tenantId,
    },
  });

  const templatesByChannel: Record<Channel, any> = {} as any;
  templates.forEach((t) => {
    templatesByChannel[t.channel] = t;
  });

  // 3. Создать сообщения и добавить в очередь отправки
  let messagesCreated = 0;

  for (const contact of contacts) {
    // Определить доступные каналы для контакта
    const availableChannels: Channel[] = [];

    if (contact.tgId) availableChannels.push(Channel.TELEGRAM);
    if (contact.vkUserId) availableChannels.push(Channel.VK);
    if (contact.email) availableChannels.push(Channel.EMAIL);
    if (contact.phone) {
      availableChannels.push(Channel.SMS);
      availableChannels.push(Channel.WHATSAPP);
    }

    // Выбрать канал по приоритету (из политики или default)
    const channelPriority: Channel[] = [
      Channel.WHATSAPP,
      Channel.TELEGRAM,
      Channel.VK,
      Channel.EMAIL,
      Channel.SMS,
    ];

    let selectedChannel: Channel | null = null;

    for (const ch of channelPriority) {
      if (availableChannels.includes(ch) && templatesByChannel[ch]) {
        // Проверить согласие
        const hasConsent = contact.consents.some(
          (c) => c.channel === ch && c.scope === 'PROMO'
        );

        // Проверить подавление
        const isSuppressed = contact.suppressions.some(
          (s) => s.channel === null || s.channel === ch
        );

        if (hasConsent && !isSuppressed) {
          selectedChannel = ch;
          break;
        }
      }
    }

    if (!selectedChannel) {
      console.log(`⚠️  Contact ${contact.id}: no available channel`);
      continue;
    }

    const template = templatesByChannel[selectedChannel];

    // Генерация dedupe key
    const dedupeKey = generateDedupeKey(tenantId, campaignId, contact.id, selectedChannel);

    // Проверка дубликатов
    const existing = await prisma.message.findUnique({
      where: { dedupeKey },
    });

    if (existing) {
      console.log(`⚠️  Message already exists: ${dedupeKey}`);
      continue;
    }

    // Подготовить переменные для рендера
    const variables = {
      parent_name: 'Родитель', // TODO: взять из контакта
      child_age: contact.childAge || 10,
      city: contact.city || 'Москва',
      track: 'Python',
      slots: 'Вт 16:00, Чт 18:00',
    };

    // Создать сообщение
    const message = await prisma.message.create({
      data: {
        tenantId,
        campaignId,
        contactId: contact.id,
        channel: selectedChannel,
        templateId: template.id,
        payload: variables,
        dedupeKey,
        status: 'QUEUED',
      },
    });

    // Добавить в очередь отправки
    await sendMessageQueue.add('send', {
      messageId: message.id,
      tenantId,
      contactId: contact.id,
      channel: selectedChannel,
      templateId: template.id,
      variables,
    });

    messagesCreated++;
  }

  console.log(`✅ Created ${messagesCreated} messages for campaign ${campaignId}`);

  return { messagesCreated };
}

