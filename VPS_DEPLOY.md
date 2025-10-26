# Деплой на VPS Ubuntu 24.04 (1GB RAM)

## 📋 Требования

- Ubuntu 24.04
- 1GB RAM, 1 CPU
- Root или sudo доступ
- Открытые порты: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

## 🚀 Пошаговая инструкция

### 1. Подключение к VPS

```bash
ssh root@your-vps-ip
# или
ssh user@your-vps-ip
```

### 2. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Установка Docker

```bash
# Установить зависимости
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Добавить GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавить репозиторий Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установить Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавить пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Перелогиниться для применения изменений
exit
# Заново подключиться по SSH
```

### 4. Проверка Docker

```bash
docker --version
docker compose version
```

### 5. Установка дополнительных инструментов

```bash
# Git
sudo apt install -y git

# Node.js и pnpm (для миграций)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
```

### 6. Клонирование проекта

```bash
# Создать директорию для проектов
mkdir -p ~/projects
cd ~/projects

# Клонировать репозиторий
git clone https://github.com/9Roxxx/AlgoSaaS.git
cd AlgoSaaS
```

### 7. Настройка переменных окружения

```bash
# Создать .env файл
cp env.example .env

# Отредактировать .env (используем nano или vim)
nano .env
```

**Важные переменные для VPS:**

```bash
# Database
DATABASE_URL="postgresql://algor:STRONG_PASSWORD_HERE@postgres:5432/algor_orchestrator?schema=public"

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT (ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ!)
JWT_SECRET=your-super-strong-production-secret-min-32-chars

# API
API_PORT=3001
NODE_ENV=production

# Email (опционально, для тестирования можно оставить пустым)
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=
```

Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`

### 8. Запуск только инфраструктуры (Postgres + Redis)

```bash
# Запустить только БД и Redis
docker compose -f docker-compose.vps.yml up -d

# Проверить статус
docker compose -f docker-compose.vps.yml ps

# Проверить логи
docker compose -f docker-compose.vps.yml logs -f postgres redis
```

### 9. Установка зависимостей и миграции

```bash
# Установить зависимости
pnpm install

# Сгенерировать Prisma Client
pnpm --filter @algor/db generate

# Применить миграции
pnpm --filter @algor/db push

# Запустить seed (создать тестовые данные)
pnpm --filter @algor/db seed
```

### 10. Запуск API и Worker напрямую (без Docker)

**Вариант A: Через PM2 (рекомендуется)**

```bash
# Установить PM2
sudo npm install -g pm2

# Создать ecosystem файл
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'algor-api',
      cwd: '/home/ubuntu/projects/AlgoSaaS/apps/api',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://algor:algor123@localhost:5432/algor_orchestrator?schema=public',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        JWT_SECRET: 'your-secret-here',
        API_PORT: '3001'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M'
    },
    {
      name: 'algor-worker',
      cwd: '/home/ubuntu/projects/AlgoSaaS/apps/worker',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://algor:algor123@localhost:5432/algor_orchestrator?schema=public',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        WORKER_CONCURRENCY: '2'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M'
    }
  ]
};
EOF

# Собрать проекты
pnpm --filter @algor/api build
pnpm --filter @algor/worker build

# Запустить через PM2
pm2 start ecosystem.config.js

# Сохранить конфигурацию PM2
pm2 save
pm2 startup

# Проверить статус
pm2 status
pm2 logs
```

**Вариант B: Через Docker (если хватит памяти)**

```bash
# Раскомментировать api и worker в docker-compose.vps.yml
# Затем:
docker compose -f docker-compose.vps.yml up -d --build
```

### 11. Настройка Nginx (reverse proxy)

```bash
# Установить Nginx
sudo apt install -y nginx

# Создать конфигурацию
sudo nano /etc/nginx/sites-available/algor
```

Вставить:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Замените на ваш домен или IP

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://localhost:3001/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Redirect tracking
    location /r/ {
        proxy_pass http://localhost:3001/api/v1/r/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/algor /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx

# Включить автозапуск
sudo systemctl enable nginx
```

### 12. Настройка Firewall (UFW)

```bash
# Включить UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Проверить статус
sudo ufw status
```

### 13. Проверка работы

```bash
# Проверить API
curl http://localhost:3001/health

# Если Nginx настроен:
curl http://your-vps-ip/api/health

# Проверить Swagger
# Открыть в браузере: http://your-vps-ip/docs
```

### 14. Логирование и мониторинг

```bash
# PM2 логи
pm2 logs

# Docker логи
docker compose -f docker-compose.vps.yml logs -f

# Системные ресурсы
htop
# или
free -h
df -h
```

## 🔧 Управление сервисами

### PM2 команды

```bash
pm2 status              # Статус всех процессов
pm2 restart all         # Перезапустить все
pm2 stop all            # Остановить все
pm2 logs                # Показать логи
pm2 monit               # Мониторинг в реальном времени
```

### Docker команды

```bash
docker compose -f docker-compose.vps.yml ps       # Статус контейнеров
docker compose -f docker-compose.vps.yml logs -f  # Логи
docker compose -f docker-compose.vps.yml restart  # Перезапуск
docker compose -f docker-compose.vps.yml down     # Остановить всё
```

## 🔄 Обновление проекта

```bash
cd ~/projects/AlgoSaaS

# Получить новые изменения
git pull origin master

# Установить новые зависимости (если есть)
pnpm install

# Применить новые миграции (если есть)
pnpm --filter @algor/db push

# Пересобрать
pnpm --filter @algor/api build
pnpm --filter @algor/worker build

# Перезапустить
pm2 restart all
```

## 📊 Мониторинг использования памяти

```bash
# Проверить использование памяти
free -m

# PM2 процессы
pm2 monit

# Docker контейнеры
docker stats
```

**Ожидаемое использование:**
- PostgreSQL: ~150-200MB
- Redis: ~50-80MB
- API: ~150-200MB
- Worker: ~150-200MB
- Nginx: ~10-20MB
- System: ~100-150MB
---
**Итого: ~600-850MB** (должно поместиться в 1GB)

## ⚠️ Troubleshooting

### Out of Memory

```bash
# Создать swap файл (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Сделать постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Порт 3001 занят

```bash
# Проверить что слушает порт
sudo lsof -i :3001

# Убить процесс
sudo kill -9 PID
```

### Postgres не запускается

```bash
# Проверить логи
docker compose -f docker-compose.vps.yml logs postgres

# Пересоздать контейнер
docker compose -f docker-compose.vps.yml down
docker volume rm algosaas_postgres_data
docker compose -f docker-compose.vps.yml up -d
```

## 🎯 Следующие шаги

1. ✅ Настроить SSL (Let's Encrypt)
2. ✅ Настроить домен
3. ✅ Добавить мониторинг (Grafana/Prometheus)
4. ✅ Настроить автоматические бэкапы
5. ✅ Настроить CI/CD

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте логи: `pm2 logs` или `docker compose logs`
2. Проверьте память: `free -m`
3. Проверьте процессы: `pm2 status` или `docker ps`

