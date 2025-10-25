# Deployment Guide

## Production Deployment

### Prerequisites

- Docker & Docker Compose
- Node.js >= 18
- pnpm >= 8
- PostgreSQL 16
- Redis 7
- ClickHouse (опционально для аналитики)

## Option 1: Docker Compose (Recommended)

### 1. Production docker-compose.yml

Создайте `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: algor_orchestrator
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - algor-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - algor-network

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    restart: always
    environment:
      CLICKHOUSE_DB: algor_events
      CLICKHOUSE_USER: ${CLICKHOUSE_USER}
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    networks:
      - algor-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - algor-network

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    networks:
      - algor-network

  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    depends_on:
      - api
    networks:
      - algor-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
      - admin
    networks:
      - algor-network

networks:
  algor-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  clickhouse_data:
```

### 2. Dockerfiles

**apps/api/Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @algor/api build

FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages ./packages

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

**apps/worker/Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @algor/worker build

FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/packages ./packages

CMD ["node", "dist/main.js"]
```

**apps/admin/Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/admin ./apps/admin

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @algor/admin build

FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/apps/admin/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
```

### 3. Nginx конфигурация

**nginx.conf:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3001;
    }

    upstream admin {
        server admin:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Admin Panel
        location / {
            proxy_pass http://admin;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API
        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. Deploy

```bash
# 1. Создать .env.production
cp .env.example .env.production
# Заполнить production переменные

# 2. Применить миграции
pnpm db:migrate

# 3. Build и запуск
docker compose -f docker-compose.prod.yml up -d --build

# 4. Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

## Option 2: Kubernetes

### Helm Chart

```bash
# TODO: Создать Helm chart
helm create algor-orchestrator
```

## Environment Variables (Production)

### Критичные переменные

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/algor_orchestrator"

# Redis
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=strong-password

# JWT
JWT_SECRET=super-strong-secret-key-32-chars-min
JWT_EXPIRES_IN=7d

# API Keys (для продакшн провайдеров)
TELEGRAM_BOT_TOKEN=your-real-token
VK_ACCESS_TOKEN=your-real-token
MAILGUN_API_KEY=your-real-key
SMS_PROVIDER_API_KEY=your-real-key
```

## Мониторинг

### Health Checks

API предоставляет `/health` endpoint:

```bash
curl http://localhost:3001/health
# {"status":"ok","database":"connected","redis":"connected"}
```

### Логирование

Production логи в JSON формате:

```json
{
  "level": "info",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Message sent",
  "context": {
    "messageId": "msg_123",
    "channel": "telegram",
    "tenantId": "tenant_1"
  }
}
```

## Резервное копирование

### PostgreSQL

```bash
# Backup
pg_dump -h localhost -U algor algor_orchestrator > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U algor algor_orchestrator < backup_20240101.sql
```

### Redis

```bash
# Redis автоматически сохраняет в /data/dump.rdb
docker cp algor-redis:/data/dump.rdb ./redis_backup.rdb
```

## Масштабирование

### Horizontal Scaling

1. **API**: Можно запускать несколько инстансов за load balancer
2. **Worker**: Можно запускать несколько инстансов (BullMQ автоматически распределит нагрузку)
3. **Database**: Использовать read replicas для чтения

```yaml
# docker-compose.scale.yml
services:
  api:
    deploy:
      replicas: 3
  
  worker:
    deploy:
      replicas: 5
```

## Security Checklist

- [ ] Использовать сильные пароли для всех сервисов
- [ ] Включить SSL/TLS для всех соединений
- [ ] Настроить firewall (закрыть прямой доступ к БД)
- [ ] Включить HTTPS для Admin и API
- [ ] Регулярно обновлять зависимости
- [ ] Включить rate limiting
- [ ] Настроить CORS правильно
- [ ] Использовать secrets management (Vault)
- [ ] Логировать все критичные действия
- [ ] Настроить alerts на подозрительную активность

## Troubleshooting

### High Memory Usage

```bash
# Проверить использование памяти
docker stats

# Увеличить лимиты в docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Slow Database Queries

```bash
# Включить slow query log
# В PostgreSQL: log_min_duration_statement = 1000

# Анализировать запросы
EXPLAIN ANALYZE SELECT ...
```

### Queue Overflow

```bash
# Проверить depth очереди
redis-cli -h localhost
> LLEN bull:send-message:wait

# Увеличить количество workers
# В docker-compose.yml:
worker:
  environment:
    WORKER_CONCURRENCY: 10
```

## Rollback Strategy

```bash
# 1. Остановить новую версию
docker compose -f docker-compose.prod.yml stop

# 2. Откатить миграции БД (если нужно)
pnpm db:migrate:rollback

# 3. Запустить старую версию
git checkout previous-tag
docker compose -f docker-compose.prod.yml up -d

# 4. Проверить health
curl http://localhost:3001/health
```

## Поддержка

Для production поддержки обращайтесь:
- Email: ops@algoritmika.org
- On-call: +7 (XXX) XXX-XX-XX

