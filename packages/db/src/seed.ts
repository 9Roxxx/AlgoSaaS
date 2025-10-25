import { PrismaClient, Channel, ConsentScope, ConsentSource, TemplateStatus, TemplateCategory, UserRole, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем seed...');

  // 1. Создать тестового арендатора
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-algoritmika-demo' },
    update: {},
    create: {
      id: 'tenant-algoritmika-demo',
      name: 'Алгоритмика Демо',
      status: TenantStatus.ACTIVE,
    },
  });
  console.log('✅ Tenant создан:', tenant.name);

  // 2. Создать админа
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@algoritmika.demo'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@algoritmika.demo',
      password: hashedPassword,
      role: UserRole.OWNER,
    },
  });
  console.log('✅ User создан:', user.email);

  // 3. Создать тестовые контакты
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { 
        tenantId_phone: {
          tenantId: tenant.id,
          phone: '+79161234567'
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: '+79161234567',
        email: 'anna.petrova@example.com',
        tgId: '123456789',
        city: 'Москва',
        childAge: 9,
        interests: { tracks: ['python', 'scratch'], trialBooked: false },
      },
    }),
    prisma.contact.upsert({
      where: { 
        tenantId_phone: {
          tenantId: tenant.id,
          phone: '+79167654321'
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: '+79167654321',
        email: 'ivan.ivanov@example.com',
        vkUserId: 'vk_987654321',
        city: 'Санкт-Петербург',
        childAge: 11,
        interests: { tracks: ['unity', 'roblox'], trialBooked: false },
      },
    }),
    prisma.contact.upsert({
      where: { 
        tenantId_phone: {
          tenantId: tenant.id,
          phone: '+79169999999'
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: '+79169999999',
        email: 'maria.smirnova@example.com',
        tgId: '555555555',
        city: 'Москва',
        childAge: 10,
        interests: { tracks: ['python', 'gamedev'], trialBooked: false },
      },
    }),
  ]);
  console.log('✅ Контакты созданы:', contacts.length);

  // 4. Создать согласия
  for (const contact of contacts) {
    if (contact.tgId) {
      await prisma.consent.upsert({
        where: {
          tenantId_contactId_channel_scope: {
            tenantId: tenant.id,
            contactId: contact.id,
            channel: Channel.TELEGRAM,
            scope: ConsentScope.PROMO,
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          contactId: contact.id,
          channel: Channel.TELEGRAM,
          scope: ConsentScope.PROMO,
          source: ConsentSource.TG_START,
          policyVersion: '2024-01',
          proofUrl: 'https://storage.example.com/consents/tg_start_screenshot.png',
        },
      });
    }

    if (contact.email) {
      await prisma.consent.upsert({
        where: {
          tenantId_contactId_channel_scope: {
            tenantId: tenant.id,
            contactId: contact.id,
            channel: Channel.EMAIL,
            scope: ConsentScope.PROMO,
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          contactId: contact.id,
          channel: Channel.EMAIL,
          scope: ConsentScope.PROMO,
          source: ConsentSource.FORM,
          policyVersion: '2024-01',
          proofUrl: 'https://storage.example.com/consents/email_form_screenshot.png',
        },
      });
    }

    if (contact.vkUserId) {
      await prisma.consent.upsert({
        where: {
          tenantId_contactId_channel_scope: {
            tenantId: tenant.id,
            contactId: contact.id,
            channel: Channel.VK,
            scope: ConsentScope.PROMO,
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          contactId: contact.id,
          channel: Channel.VK,
          scope: ConsentScope.PROMO,
          source: ConsentSource.VK_SUB,
          policyVersion: '2024-01',
        },
      });
    }
  }
  console.log('✅ Согласия созданы');

  // 5. Создать шаблоны (по требованию: 2 value, 2 offer, 1 service)
  const templates = [
    // VALUE-FIRST шаблоны
    {
      channel: Channel.TELEGRAM,
      name: 'TG: Чек-лист по Python',
      body: `Привет, {{parent_name}}! 🐍

Собрали для вас чек-лист: 5 шагов, как помочь ребёнку {{child_age}} лет освоить Python:

✅ Начните с визуального программирования
✅ Используйте игровые платформы (CodeCombat)
✅ Создавайте простые проекты (калькулятор, квест)
✅ Поддерживайте интерес через геймификацию
✅ Практикуйте регулярно по 30-40 минут

Хотите узнать больше? Запишитесь на бесплатный пробный урок в {{city}}: https://algoritmika.org/trial

Реклама. ООО «Алгоритмика». algoritmika.org
Отписаться: /stop`,
      variables: ['parent_name', 'child_age', 'city'],
      category: TemplateCategory.VALUE_FIRST,
    },
    {
      channel: Channel.EMAIL,
      name: 'Email: Мини-урок Scratch',
      body: `Здравствуйте, {{parent_name}}!

📚 Мини-урок для детей {{child_age}} лет: создаём первую игру в Scratch

Scratch — это визуальный язык программирования, идеальный для начинающих. За 20 минут ваш ребёнок сможет создать свою первую игру!

🎮 Что мы создадим:
- Игровое поле
- Управляемого персонажа
- Систему очков
- Звуковые эффекты

📹 Видео-урок: https://algoritmika.org/scratch-lesson
📝 Конспект: https://algoritmika.org/scratch-guide

Пробуйте и делитесь результатами!

С уважением,
Команда Алгоритмика

---
Реклама. ООО «Алгоритмика». algoritmika.org
Отписаться: {{unsubscribe_link}}`,
      variables: ['parent_name', 'child_age', 'unsubscribe_link'],
      category: TemplateCategory.VALUE_FIRST,
    },

    // OFFER шаблоны
    {
      channel: Channel.WHATSAPP,
      name: 'WA: Пробный урок Python',
      body: `Привет, {{parent_name}}! 👋

🎓 Приглашаем {{child_age}}-летнего юного программиста на БЕСПЛАТНЫЙ пробный урок по Python в {{city}}!

🗓 Доступные слоты:
{{slots}}

На уроке ребёнок:
✨ Создаст свою первую программу
✨ Познакомится с преподавателем
✨ Получит персональный план обучения

📍 Формат: онлайн или офлайн
⏱ Длительность: 60 минут

Забронировать место: https://algoritmika.org/trial?track={{track}}

Реклама. ООО «Алгоритмика». algoritmika.org`,
      variables: ['parent_name', 'child_age', 'city', 'slots', 'track'],
      category: TemplateCategory.OFFER,
    },
    {
      channel: Channel.VK,
      name: 'VK: Специальное предложение',
      body: `{{parent_name}}, специально для вас! 🎁

🔥 Скидка 30% на курсы программирования для детей {{child_age}} лет в {{city}}

Только до конца недели! Успейте записаться:
🐍 Python для начинающих
🎮 Создание игр в Unity
🤖 Робототехника и Arduino

Что входит:
✅ 32 занятия (4 месяца)
✅ Сертификат по окончании
✅ Портфолио из 8 проектов
✅ Поддержка куратора

Записаться со скидкой: https://vk.cc/algoritmika_promo

Реклама. ООО «Алгоритмика». algoritmika.org
Отписаться: напишите СТОП`,
      variables: ['parent_name', 'child_age', 'city'],
      category: TemplateCategory.OFFER,
    },

    // SERVICE шаблон
    {
      channel: Channel.SMS,
      name: 'SMS: Напоминание о пробном уроке',
      body: `{{parent_name}}, напоминаем: пробный урок по {{track}} завтра в {{time}}. Адрес: {{address}}. Вопросы: +7 (495) 123-45-67. Алгоритмика`,
      variables: ['parent_name', 'track', 'time', 'address'],
      category: TemplateCategory.SERVICE,
    },
  ];

  for (const tpl of templates) {
    await prisma.template.create({
      data: {
        tenantId: tenant.id,
        channel: tpl.channel,
        name: tpl.name,
        body: tpl.body,
        variables: tpl.variables,
        status: TemplateStatus.APPROVED,
        category: tpl.category,
      },
    });
  }
  console.log('✅ Шаблоны созданы:', templates.length);

  // 6. Создать тестовый сегмент
  const segment = await prisma.segment.create({
    data: {
      tenantId: tenant.id,
      name: 'Москва, 9-12 лет, без записи на пробный',
      filterDsl: JSON.stringify({
        city: 'Москва',
        childAge: { gte: 9, lte: 12 },
        'interests.trialBooked': false,
      }),
    },
  });
  console.log('✅ Сегмент создан:', segment.name);

  // 7. Создать YAML политику
  const yamlPolicy = `channels:
  priority: [whatsapp, telegram, vk, email, sms]
  quiet_hours:
    start: "20:00"
    end: "10:00"
    tz_by_contact: true
  promo_cadence:
    per_contact_hours: 48
    max_per_week: 2

whatsapp:
  mode: hybrid
  sender_pools:
    - id: alg-ru-01
      max_rate_per_min: 60
      jitter_seconds: [2, 12]
  template_policy:
    require_approved_templates: true
    mix: { value_first: 2, offer: 1 }
  stop_triggers:
    complaint_rate: 0.003
    undelivered_rate: 0.08
  fallback_after_minutes: 180

telegram:
  sender_pools:
    - id: tg-bot-main
      max_rate_per_min: 30
      jitter_seconds: [1, 5]

vk:
  sender_pools:
    - id: vk-community-main
      max_rate_per_min: 20
      jitter_seconds: [3, 8]

email:
  sender_pools:
    - id: mailgun-primary
      max_rate_per_min: 100
      jitter_seconds: [0, 2]

sms:
  sender_pools:
    - id: sms-provider-main
      max_rate_per_min: 50
      jitter_seconds: [1, 3]

compliance:
  require_opt_in: true
  ad_label_required: true
  global_suppress_on_stop: true
  consent_ledger_fields: [channel, scope, source, timestamp, policy_version, proof_url]
`;

  const rule = await prisma.orchestrationRule.create({
    data: {
      tenantId: tenant.id,
      yaml: yamlPolicy,
      version: 1,
      isActive: true,
    },
  });
  console.log('✅ Политика оркестрации создана');

  console.log('\n🎉 Seed завершён успешно!\n');
  console.log('📧 Логин: admin@algoritmika.demo');
  console.log('🔑 Пароль: admin123\n');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

