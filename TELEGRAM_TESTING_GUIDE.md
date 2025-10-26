# 🤖 Telegram Bot Testing Guide

## Как работает тестирование Telegram в Algor Orchestrator

### 1. 📱 Создание Telegram Bot

```bash
# 1. Найди @BotFather в Telegram
# 2. Отправь команду /newbot
# 3. Выбери имя для бота (например: "Algor Test Bot")
# 4. Выбери username (например: "algor_test_bot")
# 5. Получи токен: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. 🔧 Настройка в Algor Orchestrator

```typescript
// В .env файле добавь:
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=tg_webhook_secret_2024_change_me
```

### 3. 🚀 Реальные тесты

#### A. Отправка сообщения через API
```bash
curl -X POST http://localhost:3001/api/v1/test/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "telegram",
    "recipient": "@username",
    "message": "Привет! Это тестовое сообщение из Algor Orchestrator 🚀"
  }'
```

#### B. Настройка Webhook
```bash
# Установить webhook для получения сообщений
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/v1/webhooks/telegram"
```

#### C. Тестирование получения сообщений
```bash
# Симуляция webhook от Telegram
curl -X POST http://localhost:3001/api/v1/test/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 123,
      "from": {
        "id": 123456789,
        "is_bot": false,
        "first_name": "Test",
        "username": "test_user"
      },
      "chat": {
        "id": 123456789,
        "first_name": "Test",
        "username": "test_user",
        "type": "private"
      },
      "date": 1640995200,
      "text": "Привет, бот!"
    }
  }'
```

### 4. 📊 Мониторинг и аналитика

```typescript
// Получение статистики по Telegram
GET /api/v1/analytics/telegram
{
  "total_messages": 1250,
  "delivered": 1200,
  "failed": 50,
  "avg_response_time": "1.2s",
  "cost_per_message": 0
}
```

### 5. 🔄 Полный цикл тестирования

1. **Отправка сообщения** → Bot отправляет сообщение пользователю
2. **Получение ответа** → Webhook получает ответ от пользователя  
3. **Обработка** → Система обрабатывает ответ
4. **Аналитика** → Записывает метрики в ClickHouse
5. **Уведомления** → Отправляет уведомления в CRM

### 6. 🛡️ Anti-ban политики

```yaml
# В orchestration-policy.yaml
telegram:
  rate_limit:
    messages_per_minute: 30
    messages_per_hour: 1000
  quiet_hours:
    start: "22:00"
    end: "09:00"
  content_mix:
    promotional: 30%
    informational: 50%
    transactional: 20%
```

### 7. 🧪 Тестовые сценарии

#### Сценарий 1: Простая отправка
```bash
# Отправить приветственное сообщение
POST /api/v1/test/send-message
{
  "channel": "telegram",
  "recipient": "@new_user",
  "message": "Добро пожаловать в Algoritmika! 🎓"
}
```

#### Сценарий 2: Массовая рассылка
```bash
# Отправить уведомление о курсе
POST /api/v1/campaigns/create
{
  "name": "Python Course Launch",
  "channel": "telegram",
  "template": "course_announcement",
  "segment": "python_interested_users",
  "schedule": "2025-10-27T10:00:00Z"
}
```

#### Сценарий 3: Интерактивные кнопки
```bash
# Отправить сообщение с кнопками
POST /api/v1/test/send-message
{
  "channel": "telegram",
  "recipient": "@user",
  "message": "Выберите курс:",
  "keyboard": {
    "inline_keyboard": [
      [
        {"text": "Python", "callback_data": "course_python"},
        {"text": "JavaScript", "callback_data": "course_js"}
      ]
    ]
  }
}
```

### 8. 📈 Метрики и KPI

- **Delivery Rate**: % доставленных сообщений
- **Response Rate**: % ответов от пользователей  
- **Engagement**: Время взаимодействия
- **Cost per Lead**: Стоимость привлечения лида
- **Conversion Rate**: % конверсии в продажи

### 9. 🔍 Отладка и логи

```bash
# Просмотр логов Telegram коннектора
tail -f logs/telegram-connector.log

# Мониторинг webhook'ов
tail -f logs/webhook-telegram.log

# Статистика по сообщениям
SELECT * FROM telegram_messages 
WHERE created_at >= NOW() - INTERVAL 1 HOUR;
```

### 10. 🚨 Алерты и уведомления

```typescript
// Настройка алертов
{
  "alerts": {
    "high_failure_rate": {
      "threshold": 10,
      "action": "pause_campaign"
    },
    "low_response_rate": {
      "threshold": 5,
      "action": "optimize_content"
    }
  }
}
```

## 🎯 Практические примеры

### Пример 1: Тест приветственного бота
1. Создай бота через @BotFather
2. Добавь токен в .env
3. Отправь тестовое сообщение через API
4. Проверь получение в Telegram
5. Протестируй webhook ответ

### Пример 2: Тест массовой рассылки
1. Создай сегмент пользователей
2. Создай шаблон сообщения
3. Запусти кампанию
4. Мониторь доставку в реальном времени
5. Анализируй результаты

### Пример 3: Тест интерактивности
1. Отправь сообщение с кнопками
2. Получи callback от пользователя
3. Обработай ответ
4. Отправь следующее сообщение
5. Запиши в CRM

---

**🎉 Теперь ты можешь тестировать все функции Telegram в реальном времени!**
