import { Job } from 'bullmq';
import { prisma, Channel, MessageStatus } from '@algor/db';
import {
  TelegramConnector,
  VKConnector,
  EmailConnector,
  SMSConnector,
  WhatsAppConnector,
  TemplateRenderer,
} from '@algor/connectors';
import { getJitterMs, isQuietHours } from '@algor/shared';

interface SendMessageJob {
  messageId: string;
  tenantId: string;
  contactId: string;
  channel: Channel;
  templateId: string;
  variables: Record<string, any>;
}

const connectors = {
  [Channel.TELEGRAM]: new TelegramConnector(),
  [Channel.VK]: new VKConnector(),
  [Channel.EMAIL]: new EmailConnector(),
  [Channel.SMS]: new SMSConnector(),
  [Channel.WHATSAPP]: new WhatsAppConnector('hybrid'),
};

export async function sendMessageProcessor(job: Job<SendMessageJob>) {
  const { messageId, tenantId, contactId, channel, templateId, variables } = job.data;

  console.log(`📨 Sending message ${messageId} via ${channel}`);

  // 1. Проверить тихие часы (TODO: загрузить из политики)
  if (isQuietHours('20:00', '10:00')) {
    console.log(`⏰ Quiet hours, delaying message ${messageId}`);
    // Отложить на потом
    throw new Error('QUIET_HOURS'); // Worker автоматически сделает retry
  }

  // 2. Получить контакт и шаблон
  const [contact, template] = await Promise.all([
    prisma.contact.findUnique({ where: { id: contactId } }),
    prisma.template.findUnique({ where: { id: templateId } }),
  ]);

  if (!contact || !template) {
    throw new Error('Contact or template not found');
  }

  // 3. Рендерить шаблон
  const renderedContent = await TemplateRenderer.render(template.body, variables);

  // 4. Применить jitter (задержка)
  const jitterMs = getJitterMs(2, 12);
  await new Promise((resolve) => setTimeout(resolve, jitterMs));

  // 5. Отправить через соответствующий коннектор
  const connector = connectors[channel];

  const result = await connector.send({
    messageId,
    channel,
    recipient: {
      phone: contact.phone || undefined,
      email: contact.email || undefined,
      tgId: contact.tgId || undefined,
      vkUserId: contact.vkUserId || undefined,
    },
    content: renderedContent,
    variables,
  });

  // 6. Обновить статус в БД
  await prisma.message.update({
    where: { id: messageId },
    data: { status: result.status },
  });

  // 7. Создать Delivery запись
  await prisma.delivery.create({
    data: {
      tenantId,
      messageId,
      providerMsgId: result.providerMessageId,
      status: result.status,
      errorCode: result.errorCode,
    },
  });

  console.log(`✅ Message ${messageId} sent with status: ${result.status}`);

  return result;
}

