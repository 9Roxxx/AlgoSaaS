# Quick Start Guide

## Быстрый старт за 5 минут

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка переменных окружения

```bash
cp env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/admin/.env.example apps/admin/.env
```

### 3. Запуск инфраструктуры (Docker)

```bash
make up
# или
docker compose up -d
```

Это запустит:
- PostgreSQL (порт 5432)
- Redis (порт 6379)
- ClickHouse (порты 8123, 9000)
- Mailhog (порт 8025 для Web UI)

### 4. Применение миграций и seed данных

```bash
make db-migrate
make db-seed
```

Seed создаст:
- Тестовый tenant "Алгоритмика Демо"
- Админа: `admin@algoritmika.demo` / `admin123`
- 3 контакта с согласиями
- 5 шаблонов (по каналам)
- Тестовый сегмент
- YAML политику оркестрации

### 5. Запуск сервисов в dev режиме

```bash
make dev
# или
pnpm dev
```

Это запустит:
- **API**: http://localhost:3001
- **Worker**: Background процесс
- **Admin**: http://localhost:3000

### 6. Открыть интерфейсы

- **Admin Panel**: http://localhost:3000
- **API Swagger**: http://localhost:3001/docs
- **Mailhog UI**: http://localhost:8025

## Тестирование платформы

### Вход в систему

1. Откройте http://localhost:3000/login
2. Введите: `admin@algoritmika.demo` / `admin123`
3. Перейдите в Dashboard

### Создание тестовой кампании через API

```bash
# 1. Получить JWT токен
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@algoritmika.demo","password":"admin123"}'

# Скопируйте accessToken из ответа

# 2. Создать кампанию
curl -X POST http://localhost:3001/api/v1/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест кампания"}'

# 3. Запустить кампанию
curl -X POST http://localhost:3001/api/v1/campaigns/{campaign_id}/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "segmentId": "SEGMENT_ID",
    "templateIds": ["TEMPLATE_ID"],
    "waveSize": 10
  }'
```

### Проверка отправленных email в Mailhog

1. Откройте http://localhost:8025
2. Посмотрите отправленные письма
3. Проверьте трекинг-ссылки

## Полезные команды

```bash
# Логи Docker контейнеров
make logs

# Остановить Docker
make down

# Prisma Studio (GUI для БД)
make db-studio

# Линтинг
pnpm lint

# Форматирование
pnpm format

# Тесты
pnpm test

# Полная очистка и переустановка
make clean
make setup
```

## Структура проекта

```
algor-orchestrator/
├── apps/
│   ├── api/          # NestJS REST API (порт 3001)
│   ├── worker/       # BullMQ Worker
│   └── admin/        # Next.js Admin Panel (порт 3000)
├── packages/
│   ├── db/           # Prisma schema & seed
│   ├── shared/       # Типы и утилиты
│   └── connectors/   # Telegram, VK, Email, SMS, WhatsApp
└── docker-compose.yml
```

## Следующие шаги

1. Изучите [API документацию](http://localhost:3001/docs)
2. Посмотрите примеры запросов в `apps/api/docs/api-examples.http`
3. Ознакомьтесь с [BACKLOG.md](./BACKLOG.md) для roadmap
4. Прочитайте [CONTRIBUTING.md](./CONTRIBUTING.md) для разработки

## Troubleshooting

### Ошибка подключения к БД

```bash
# Проверьте что PostgreSQL запущен
docker ps | grep postgres

# Проверьте переменную DATABASE_URL в .env
cat .env | grep DATABASE_URL
```

### Worker не обрабатывает задачи

```bash
# Проверьте Redis
docker ps | grep redis

# Проверьте логи Worker
pnpm --filter @algor/worker dev
```

### API возвращает 500

```bash
# Проверьте логи API
# В терминале где запущен API будут логи

# Проверьте что миграции применены
pnpm db:migrate
```

## Поддержка

- GitHub Issues: [создать issue]
- Email: dev@algoritmika.org
- Документация: [README.md](./README.md)

