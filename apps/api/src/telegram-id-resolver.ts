import * as fs from 'fs';
import * as path from 'path';

/**
 * TelegramIdResolver - конвертирует @username в numeric ID
 * Сохраняет маппинг для быстрого поиска
 */
export class TelegramIdResolver {
  private botToken: string;
  private mappingFile: string;
  private usernameMap: Map<string, number> = new Map();

  constructor(botToken: string) {
    this.botToken = botToken;
    this.mappingFile = path.join(process.cwd(), 'telegram-mapping.json');
    this.loadMapping();
  }

  /**
   * Загружает маппинг из файла при старте
   */
  private loadMapping(): void {
    try {
      if (fs.existsSync(this.mappingFile)) {
        const data = fs.readFileSync(this.mappingFile, 'utf-8');
        const mapping = JSON.parse(data);
        this.usernameMap = new Map(Object.entries(mapping));
        console.log(`📂 Загружено ${this.usernameMap.size} маппингов Telegram ID`);
      }
    } catch (error) {
      console.warn(`⚠️ Не удалось загрузить маппинг:`, error);
      this.usernameMap = new Map();
    }
  }

  /**
   * Сохраняет маппинг в файл
   */
  private saveMapping(): void {
    try {
      const mapping = Object.fromEntries(this.usernameMap);
      fs.writeFileSync(this.mappingFile, JSON.stringify(mapping, null, 2));
      console.log(`💾 Маппинг сохранен (${this.usernameMap.size} записей)`);
    } catch (error) {
      console.error(`❌ Ошибка сохранения маппинга:`, error);
    }
  }

  /**
   * Добавляет маппинг username → numeric_id
   */
  addMapping(username: string, numericId: number): void {
    const cleanUsername = username.replace('@', '').toLowerCase();
    this.usernameMap.set(cleanUsername, numericId);
    this.saveMapping();
    console.log(`✅ Добавлено: @${cleanUsername} → ${numericId}`);
  }

  /**
   * Ищет numeric ID в маппинге по username
   */
  private findInMapping(username: string): number | null {
    const cleanUsername = username.replace('@', '').toLowerCase();
    return this.usernameMap.get(cleanUsername) || null;
  }

  /**
   * ГЛАВНАЯ ФУНКЦИЯ: Конвертирует @username или numeric_id в numeric_id
   * Поддерживает оба формата!
   */
  async resolveId(input: string): Promise<number> {
    console.log(`🔍 Разрешаем Telegram ID: ${input}`);

    // Если это уже numeric ID (только цифры)
    if (/^\d+$/.test(input)) {
      console.log(`✅ Это numeric ID: ${input}`);
      return parseInt(input);
    }

    // Если это отрицательное число (группа)
    if (/^-\d+$/.test(input)) {
      console.log(`✅ Это group ID: ${input}`);
      return parseInt(input);
    }

    // Если это @username
    if (input.startsWith('@')) {
      const username = input.replace('@', '').toLowerCase();
      
      // Шаг 1: Ищем в локальном маппинге
      const mappedId = this.findInMapping(username);
      if (mappedId) {
        console.log(`✅ Найден в маппинге: @${username} → ${mappedId}`);
        return mappedId;
      }

      // Шаг 2: Пробуем получить через Telegram API (getChat)
      try {
        console.log(`🌐 Ищем в Telegram API: @${username}`);
        const chatId = await this.getChatIdFromUsername(username);
        
        if (chatId) {
          // Сохраняем в маппинг для следующего раза
          this.addMapping(username, chatId);
          console.log(`✅ Получено из Telegram API: @${username} → ${chatId}`);
          return chatId;
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка при поиске в Telegram API:`, error);
      }

      // Шаг 3: Ничего не найдено
      throw new Error(
        `❌ Не удалось получить ID для @${username}\n\n` +
        `Варианты решения:\n` +
        `1. Используйте numeric Chat ID (например: 5540862911)\n` +
        `2. Убедитесь что username правильный\n` +
        `3. Напишите /start боту чтобы он вас "нашел"\n\n` +
        `Как получить numeric ID:\n` +
        `→ Откройте Telegram\n` +
        `→ Найдите @userinfobot\n` +
        `→ Отправьте /start\n` +
        `→ Скопируйте ваш ID`
      );
    }

    // Если формат неизвестен
    throw new Error(
      `❌ Неизвестный формат Telegram ID: "${input}"\n\n` +
      `Поддерживаемые форматы:\n` +
      `• @username (например: @myusername)\n` +
      `• Numeric ID (например: 5540862911)\n` +
      `• Group ID (например: -123456789)`
    );
  }

  /**
   * Получает numeric Chat ID из @username через Telegram Bot API
   * Используется метод getChat()
   */
  private async getChatIdFromUsername(username: string): Promise<number | null> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getChat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: `@${username}` }),
        }
      );

      const data = await response.json();

      if (data.ok && data.result?.id) {
        console.log(`✅ Telegram API вернул ID: ${data.result.id}`);
        return data.result.id;
      }

      if (!data.ok) {
        console.error(`❌ Telegram API ошибка: ${data.description}`);
        return null;
      }

      return null;
    } catch (error) {
      console.error(`❌ Ошибка при запросе getChat:`, error);
      return null;
    }
  }

  /**
   * Обновляет маппинг когда получаем update от Telegram
   * Используется webhook для автоматического сохранения
   */
  updateFromTelegramUpdate(update: any): void {
    try {
      let user = null;

      // Получаем user из разных типов updates
      if (update.message?.from) {
        user = update.message.from;
      } else if (update.callback_query?.from) {
        user = update.callback_query.from;
      } else if (update.edited_message?.from) {
        user = update.edited_message.from;
      }

      if (user?.username && user?.id) {
        console.log(`📨 Update от Telegram: @${user.username} (${user.id})`);
        this.addMapping(user.username, user.id);
      }
    } catch (error) {
      console.warn(`⚠️ Ошибка обновления маппинга:`, error);
    }
  }

  /**
   * Возвращает статистику маппинга
   */
  getStats(): { total: number; usernames: string[] } {
    return {
      total: this.usernameMap.size,
      usernames: Array.from(this.usernameMap.keys()),
    };
  }
}
