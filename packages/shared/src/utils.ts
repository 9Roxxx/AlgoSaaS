import { Channel } from '@algor/db';

/**
 * Генерация dedupe ключа для сообщения
 */
export function generateDedupeKey(
  tenantId: string,
  campaignId: string,
  contactId: string,
  channel: Channel,
): string {
  return `${tenantId}:${campaignId}:${contactId}:${channel}`;
}

/**
 * Случайная задержка (jitter) в миллисекундах
 */
export function getJitterMs(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

/**
 * Проверка, находится ли текущее время в "тихих часах"
 */
export function isQuietHours(
  quietStart: string, // "20:00"
  quietEnd: string, // "10:00"
  timezone?: string,
): boolean {
  const now = new Date();
  const [startHour, startMin] = quietStart.split(':').map(Number);
  const [endHour, endMin] = quietEnd.split(':').map(Number);

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Если тихие часы пересекают полночь (например, 20:00 - 10:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Форматирование телефона для WhatsApp (удаление +)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\+/g, '');
}

/**
 * Генерация Click-to-WhatsApp ссылки
 */
export function generateWhatsAppLink(phone: string, text?: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedText = text ? encodeURIComponent(text) : '';
  return `https://api.whatsapp.com/send?phone=${cleanPhone}${text ? `&text=${encodedText}` : ''}`;
}

/**
 * Парсинг команд СТОП/STOP/ОТПИСКА
 */
export function isUnsubscribeKeyword(text: string): boolean {
  const keywords = ['стоп', 'stop', 'отписка', 'unsubscribe', 'отписаться'];
  const normalized = text.toLowerCase().trim();
  return keywords.some((keyword) => normalized.includes(keyword));
}

