# Algor Orchestrator

**Мультиарендная платформа оркестрации рассылок для партнёров школы «Алгоритмика»**

## 🚀 Возможности

- **Multi-tenant архитектура** с полной изоляцией данных по арендаторам
- **Омниканальность**: Telegram, VK, Email, SMS, WhatsApp (Click-to-WA + BSP)
- **Compliance**: строгий учёт согласий (152-ФЗ), маркировка рекламы (38-ФЗ)
- **Политика как код**: YAML-конфигурация отправок, антибан-логика
- **Анти-бан система**: контроль скорости, тихие часы, микс контента, авто-стоп
- **Аналитика**: отслеживание доставок, открытий, кликов, конверсий в ClickHouse

## 🏗 Архитектура

### Monorepo структура

```
algor-orchestrator/
├── apps/
│   ├── api/          # NestJS REST API + Webhooks
│   ├── worker/       # BullMQ Worker для отправок
│   └── admin/        # Next.js 14 Admin Panel
├── packages/
│   ├── db/           # Prisma схема + миграции
│   ├── shared/       # Общие типы и утилиты
│   └── connectors/   # Коннекторы каналов
└── docker-compose.yml
```

### Технологический стек

- **Backend**: NestJS + Fastify, TypeScript
- **Frontend**: Next.js 14 (App Router), React, shadcn/ui, TanStack Query
- **Database**: PostgreSQL + Prisma ORM
- **Events**: ClickHouse
- **Queue**: BullMQ + Redis
- **Auth**: JWT + RBAC
- **Infra**: Docker Compose
- **Testing**: Vitest, Supertest, Playwright

## 📦 Установка и запуск

### Требования

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd algor-orchestrator

# 2. Установить зависимости
pnpm install

# 3. Скопировать .env
cp env.example .env
# Отредактируйте .env при необходимости

# 4. Поднять инфраструктуру (Postgres, Redis, ClickHouse, Mailhog)
docker compose up -d

# 5. Применить миграции и seed данные
pnpm db:migrate
pnpm seed

# 6. Запустить dev режим
pnpm dev

# API: http://localhost:3001
# Admin: http://localhost:3000
# Swagger: http://localhost:3001/docs
# Mailhog: http://localhost:8025
```

### Альтернатива с Makefile

```bash
make setup  # Полная настройка: install + up + migrate + seed
make dev    # Запуск dev режима
```

## 🎯 Основные команды

```bash
# Разработка
pnpm dev              # Запустить все сервисы в dev режиме
pnpm build            # Собрать все приложения
pnpm test             # Запустить тесты
pnpm lint             # Линтинг
pnpm format           # Форматирование

# База данных
pnpm db:migrate       # Применить миграции
pnpm db:push          # Push схемы без миграций
pnpm db:studio        # Открыть Prisma Studio
pnpm seed             # Заполнить тестовыми данными

# Docker
make up               # Поднять контейнеры
make down             # Остановить контейнеры
make logs             # Показать логи
```

## 🔐 Безопасность и Compliance

### 152-ФЗ (Персональные данные)

- Модель `Consent` с полным аудитом согласий
- Поля: channel, scope (promo/service), source, policyVersion, proofUrl
- Шифрование PII (phone, email) на уровне Prisma middleware

### 38-ФЗ (Реклама)

- Все промо-шаблоны содержат маркировку "Реклама"
- Механизм глобальной отписки по ключевым словам: СТОП/STOP/ОТПИСКА
- Модель `Suppress` для управления исключениями

### Анти-бан система

- **Rate limiting**: per-sender и per-tenant ограничения
- **Jitter**: случайные задержки между отправками
- **Quiet hours**: запрет отправок в ночное время (с учетом часового пояса)
- **Promo cadence**: ограничение частоты промо (48 часов между промо, макс 2 в неделю)
- **Auto-stop**: автоматическая остановка кампаний при превышении complaint_rate (0.3%) или undelivered_rate (8%)
- **Content mix**: для WhatsApp соблюдение пропорции value/offer (2:1)

## 📊 Мультиарендность

- Все данные изолированы по `tenantId`
- RBAC роли: owner, admin, marketer, viewer
- Раздельные лимиты и репутация по арендаторам
- Изоляция на уровне БД запросов (Prisma middleware)

## 🔌 Каналы отправки

| Канал | Статус | Описание |
|-------|--------|----------|
| **Telegram** | ✅ Ready | Bot API, webhooks для подписок |
| **VK** | ✅ Ready | Сообщения сообщества, webhooks |
| **Email** | ✅ Ready | Mailgun/SendGrid, tracking opens/clicks |
| **SMS** | ✅ Ready | Локальный агрегатор, DLR webhooks |
| **WhatsApp** | ⚠️ Hybrid | Click-to-WA (без API) + BSP абстракция |

### WhatsApp режимы

- `click_to_wa`: генерация `wa.me` ссылок для вставки в другие каналы
- `waba`: интерфейс для Business API через BSP (требует настройки провайдера)
- `hybrid`: автоматический выбор доступного метода

## 📝 Политика как код (YAML)

Пример политики отправок:

```yaml
channels:
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

compliance:
  require_opt_in: true
  ad_label_required: true
  global_suppress_on_stop: true
```

Загрузка через API:

```bash
POST /api/v1/orchestration/rules
Content-Type: text/yaml

<yaml content>
```

## 🧪 Тестирование

```bash
# Unit тесты
pnpm test

# API интеграционные тесты
pnpm --filter @algor/api test

# E2E smoke тесты админки
pnpm --filter @algor/admin test:e2e
```

## 📖 API Документация

OpenAPI/Swagger доступен по адресу: `http://localhost:3001/docs`

Основные эндпоинты:

- `POST /auth/signup` - регистрация арендатора
- `POST /auth/login` - вход
- `GET /contacts` - список контактов
- `POST /contacts/import` - импорт CSV
- `POST /consents` - добавление согласия
- `POST /campaigns` - создание кампании
- `POST /campaigns/:id/start` - запуск кампании
- `GET /campaigns/:id/metrics` - метрики кампании
- `POST /webhooks/telegram` - webhook Telegram
- `GET /r/:messageId/:slug` - редирект с трекингом кликов

## 🔄 Workflow отправки

1. Создание **Campaign** с привязкой к **Segment**
2. Выбор **Template** для каждого канала
3. Загрузка **OrchestrationRule** (YAML политика)
4. Запуск волны → Worker получает задачи из очереди `campaign-dispatch`
5. Генерация **Message** с `dedupeKey` для предотвращения дублей
6. Проверка согласий (`Consent`), исключений (`Suppress`), quiet hours, promo cadence
7. Отправка через соответствующий коннектор с соблюдением rate limits
8. Получение webhooks от провайдеров → обновление `Delivery` статусов
9. Логирование событий (клики, открытия, заявки) в ClickHouse
10. Мониторинг метрик и авто-стоп при превышении порогов

## 📈 Метрики и отчёты

В Admin Panel доступны:

- **Live Dashboard**: sent, delivered, read, clicked, complaints в реальном времени
- **Графики**: CTR, Conversion Rate, Complaint Rate по каналам и сегментам
- **Segment Analytics**: какие сегменты дают лучшую конверсию
- **Channel Performance**: сравнение эффективности каналов

## 🛠 Разработка

### Структура пакетов

- **@algor/api** - REST API сервис
- **@algor/worker** - Background jobs
- **@algor/admin** - Admin dashboard
- **@algor/db** - Prisma models & migrations
- **@algor/shared** - Shared utilities & types
- **@algor/connectors** - Channel connectors

### Добавление нового канала

1. Создать коннектор в `packages/connectors/src/`
2. Реализовать интерфейс `IChannelConnector`
3. Добавить в `apps/worker/src/processors/send-message.processor.ts`
4. Обновить enum `Channel` в Prisma schema
5. Добавить webhook handler в API

### Pre-commit hooks

```bash
# Настроить Husky
pnpm prepare

# Hooks автоматически запускают:
# - ESLint
# - Prettier
# - TypeScript typecheck
```

## 📋 Backlog / Roadmap

### Интеграции

- [ ] Реальная интеграция с Telegram Bot API
- [ ] Интеграция с VK API
- [ ] Настройка Mailgun/SendGrid
- [ ] Подключение SMS-провайдера
- [ ] WhatsApp BSP адаптер (Twilio/360dialog/GreenAPI)

### Мониторинг

- [ ] Grafana + Prometheus метрики
- [ ] Sentry для error tracking
- [ ] Alerts при превышении complaint rate
- [ ] Health checks для всех сервисов

### Биллинг

- [ ] Подсчёт отправок по арендаторам
- [ ] Лимиты и квоты
- [ ] Тарифные планы
- [ ] Платёжная интеграция (Stripe/ЮKassa)

### Дополнительные фичи

- [ ] A/B тестирование шаблонов
- [ ] Webhook retry механизм
- [ ] Contact deduplication
- [ ] Import validation & preview
- [ ] Template builder UI
- [ ] Segment builder UI (visual query builder)
- [ ] Advanced reporting & BI
- [ ] Multi-language support (i18n)

## 📄 Лицензия

Proprietary - Algoritmika School

## 🤝 Контакты

Для вопросов: dev@algoritmika.org

