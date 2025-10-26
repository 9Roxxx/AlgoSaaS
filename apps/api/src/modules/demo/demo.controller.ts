import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';

export class CreateContactDto {
  phone?: string;
  tgId?: string;
  vkUserId?: string;
  email?: string;
  city?: string;
  childAge?: number;
  interests?: Record<string, any>;
}

export class CreateTemplateDto {
  channel: 'TELEGRAM' | 'VK' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  name: string;
  body: string;
  variables?: string[];
  category?: 'VALUE_FIRST' | 'OFFER' | 'SERVICE';
}

export class CreateConsentDto {
  contactId: string;
  channel: 'TELEGRAM' | 'VK' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  scope: 'PROMO' | 'SERVICE';
  source: 'FORM' | 'QR' | 'C2WA' | 'TG_START' | 'VK_SUB' | 'IMPORT';
}

@Controller('demo')
export class DemoController {
  constructor() {}

  // ============================================================================
  // CONTACTS MANAGEMENT
  // ============================================================================

  @Get('contacts')
  async getContacts() {
    // Демо контакты (в реальности из БД)
    return {
      success: true,
      contacts: [
        {
          id: 'contact_1',
          phone: '+79001234567',
          tgId: '123456789',
          email: 'parent1@example.com',
          city: 'Москва',
          childAge: 10,
          interests: { tracks: ['python'], trialBooked: false },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'contact_2',
          phone: '+79007654321',
          tgId: '987654321',
          email: 'parent2@example.com',
          city: 'Санкт-Петербург',
          childAge: 12,
          interests: { tracks: ['scratch'], trialBooked: true },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'contact_3',
          phone: '+79005555555',
          tgId: '555666777',
          email: 'parent3@example.com',
          city: 'Москва',
          childAge: 8,
          interests: { tracks: ['python', 'scratch'], trialBooked: false },
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  @Post('contacts')
  @HttpCode(HttpStatus.CREATED)
  async createContact(@Body() dto: CreateContactDto) {
    // Симуляция создания контакта
    const contact = {
      id: 'contact_' + Date.now(),
      ...dto,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Contact created successfully',
      contact,
    };
  }

  // ============================================================================
  // TEMPLATES MANAGEMENT
  // ============================================================================

  @Get('templates')
  async getTemplates() {
    // Демо шаблоны (в реальности из БД)
    return {
      success: true,
      templates: [
        {
          id: 'template_1',
          channel: 'TELEGRAM',
          name: 'Приветствие Python курс',
          body: 'Привет, {{parent_name}}! 👋\n\nВаш ребенок {{child_age}} лет может начать изучать Python! 🐍\n\n🎯 Что получит ребенок:\n• Основы программирования\n• Создание игр и приложений\n• Логическое мышление\n\n📅 Записаться на пробный урок: {{trial_link}}',
          variables: ['parent_name', 'child_age', 'trial_link'],
          category: 'VALUE_FIRST',
          status: 'APPROVED',
        },
        {
          id: 'template_2',
          channel: 'TELEGRAM',
          name: 'Напоминание о пробном уроке',
          body: '{{parent_name}}, напоминаем о пробном уроке завтра в {{time}}! ⏰\n\n📍 Адрес: {{address}}\n👨‍🏫 Преподаватель: {{teacher_name}}\n\nЕсли не можете прийти, сообщите нам заранее 🙏',
          variables: ['parent_name', 'time', 'address', 'teacher_name'],
          category: 'SERVICE',
          status: 'APPROVED',
        },
        {
          id: 'template_3',
          channel: 'EMAIL',
          name: 'Email приветствие',
          body: 'Добро пожаловать в Algoritmika!\n\nУважаемый(ая) {{parent_name}},\n\nВаш ребенок {{child_age}} лет может начать изучать программирование.\n\nС уважением,\nКоманда Algoritmika',
          variables: ['parent_name', 'child_age'],
          category: 'VALUE_FIRST',
          status: 'APPROVED',
        },
      ],
    };
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() dto: CreateTemplateDto) {
    // Симуляция создания шаблона
    const template = {
      id: 'template_' + Date.now(),
      ...dto,
      version: 1,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Template created successfully',
      template,
    };
  }

  @Post('templates/:id/render')
  @HttpCode(HttpStatus.OK)
  async renderTemplate(@Param('id') id: string, @Body() variables: Record<string, any>) {
    // Симуляция рендеринга шаблона
    const templates = {
      template_1: 'Привет, Анна! 👋\n\nВаш ребенок 10 лет может начать изучать Python! 🐍\n\n🎯 Что получит ребенок:\n• Основы программирования\n• Создание игр и приложений\n• Логическое мышление\n\n📅 Записаться на пробный урок: https://algoritmika.org/trial',
      template_2: 'Анна, напоминаем о пробном уроке завтра в 15:00! ⏰\n\n📍 Адрес: ул. Тверская, 12\n👨‍🏫 Преподаватель: Иван Петров\n\nЕсли не можете прийти, сообщите нам заранее 🙏',
      template_3: 'Добро пожаловать в Algoritmika!\n\nУважаемый(ая) Анна,\n\nВаш ребенок 10 лет может начать изучать программирование.\n\nС уважением,\nКоманда Algoritmika',
    };

    return {
      success: true,
      rendered: templates[id] || 'Template not found',
      variables,
    };
  }

  // ============================================================================
  // CONSENTS MANAGEMENT
  // ============================================================================

  @Get('consents')
  async getConsents() {
    // Демо согласия
    return {
      success: true,
      consents: [
        {
          id: 'consent_1',
          contactId: 'contact_1',
          channel: 'TELEGRAM',
          scope: 'PROMO',
          source: 'TG_START',
          policyVersion: '2024-01',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'consent_2',
          contactId: 'contact_2',
          channel: 'EMAIL',
          scope: 'PROMO',
          source: 'FORM',
          policyVersion: '2024-01',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  @Post('consents')
  @HttpCode(HttpStatus.CREATED)
  async createConsent(@Body() dto: CreateConsentDto) {
    // Симуляция создания согласия
    const consent = {
      id: 'consent_' + Date.now(),
      ...dto,
      policyVersion: '2024-01',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Consent created successfully',
      consent,
    };
  }

  // ============================================================================
  // REAL TELEGRAM BOT SETUP
  // ============================================================================

  @Post('telegram/setup')
  @HttpCode(HttpStatus.OK)
  async setupTelegramBot(@Body() body: { botToken: string; webhookUrl?: string }) {
    // Симуляция настройки реального бота
    const { botToken, webhookUrl } = body;

    if (!botToken) {
      return {
        success: false,
        message: 'Bot token is required',
      };
    }

    // В реальности здесь будет:
    // 1. Проверка токена через Telegram API
    // 2. Получение информации о боте
    // 3. Настройка webhook
    // 4. Сохранение в БД

    const botInfo = {
      id: '123456789',
      username: 'algor_test_bot',
      first_name: 'Algor Test Bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };

    return {
      success: true,
      message: 'Telegram bot configured successfully',
      botInfo,
      webhookUrl: webhookUrl || 'https://your-domain.com/api/v1/webhooks/telegram',
      instructions: [
        '1. Бот создан и настроен',
        '2. Webhook установлен',
        '3. Теперь можно отправлять сообщения',
        '4. Пользователи могут писать боту /start',
      ],
    };
  }

  @Post('telegram/send-real')
  @HttpCode(HttpStatus.OK)
  async sendRealTelegramMessage(@Body() body: { 
    botToken: string; 
    chatId: string; 
    message: string; 
    templateId?: string;
    variables?: Record<string, any>;
  }) {
    const { botToken, chatId, message, templateId, variables } = body;

    if (!botToken || !chatId || !message) {
      return {
        success: false,
        message: 'Bot token, chat ID and message are required',
      };
    }

    // В реальности здесь будет отправка через Telegram Bot API
    // const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: chatId,
    //     text: message,
    //     parse_mode: 'HTML'
    //   })
    // });

    // Симуляция успешной отправки
    const result = {
      messageId: Date.now(),
      chatId,
      text: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    return {
      success: true,
      message: 'Message sent successfully',
      result,
      note: 'В реальности сообщение будет отправлено через Telegram Bot API',
    };
  }
}
