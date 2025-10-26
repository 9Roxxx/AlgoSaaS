# 📱 Telegram ID Detection Logic

## 🔍 Как система определяет тип Telegram ID

Система автоматически определяет формат ID и отправляет правильно:

### ✅ Поддерживаемые форматы:

#### 1️⃣ **@username (с @ спереди)**
```
Входная данные: @myusername
Определено как: username
API получает: @myusername
```
- Начинается с `@`
- Это публичный username пользователя в Telegram
- Telegram API принимает его в формате `@username`

#### 2️⃣ **Numeric Chat ID (только цифры)**
```
Входные данные: 123456789
Определено как: numeric_id
API получает: 123456789
```
- Только цифры
- Это уникальный ID чата
- Используется для приватных ID (часто отрицательные числа в группах)

#### 3️⃣ **Другие форматы**
```
Входные данные: что угодно другое
Отправляется как есть
```

---

## 🧠 Логика обнаружения (код)

### В браузере (dashboard.html):
```javascript
let telegramId = contact.telegram || '';

if (telegramId.startsWith('@')) {
    // Это @username - отправляем именно так
    console.log(`📍 Telegram ID определен как username: ${telegramId}`);
    recipient = { tgId: telegramId };
} else if (/^\d+$/.test(telegramId)) {
    // Это чистое число - numeric chat ID
    console.log(`📍 Telegram ID определен как numeric: ${telegramId}`);
    recipient = { tgId: telegramId };
} else {
    // Другой формат - отправляем как есть
    console.log(`📍 Telegram ID неизвестного формата, отправляем как есть: ${telegramId}`);
    recipient = { tgId: telegramId };
}
```

### На сервере (real-telegram-main.ts):
```typescript
if (chatId.startsWith('@')) {
    idType = 'username';
    actualChatId = chatId;
} else if (/^\d+$/.test(chatId)) {
    idType = 'numeric_id';
    actualChatId = chatId;
} else {
    idType = 'unknown';
    actualChatId = chatId;
}
```

---

## 📋 Примеры использования

### Пример 1: Отправка по @username
```
1. Добавляете контакт
   Email: user@example.com
   Telegram ID: @myusername
   
2. Создаете кампанию в Telegram
   
3. API отправляет:
   POST /bot.../sendMessage
   { chat_id: "@myusername", text: "..." }
   
4. ✅ Сообщение приходит!
```

### Пример 2: Отправка по numeric ID
```
1. Добавляете контакт
   Email: user@example.com
   Telegram ID: 987654321
   
2. Создаете кампанию в Telegram
   
3. API отправляет:
   POST /bot.../sendMessage
   { chat_id: 987654321, text: "..." }
   
4. ✅ Сообщение приходит!
```

---

## 🔧 Как найти свой Telegram ID

### Способ 1: @userinfobot
1. Откройте Telegram
2. Найдите бота `@userinfobot`
3. Отправьте `/start`
4. Скопируйте ваш **Id**
5. Это ваш numeric ID (например: 123456789)

### Способ 2: @username
1. Откройте Telegram Settings
2. Выберите Username
3. Скопируйте ваш username (например: myusername)
4. Используйте его как `@myusername`

### Способ 3: @get_id_bot
1. Откройте Telegram
2. Найдите бота `@get_id_bot`
3. Отправьте любое сообщение
4. Получите свой ID

---

## 📊 Логирование в консоли

Система логирует тип определенного ID:

### В браузере (F12 → Console):
```
📍 Telegram ID определен как username: @myusername
```
или
```
📍 Telegram ID определен как numeric: 987654321
```

### В PowerShell (API):
```
📤 Отправляем сообщение в Telegram (type: username, id: @myusername)
📥 Ответ от Telegram: { ok: true, result: { message_id: 123 } }
✅ Сообщение отправлено! ID: 123
```

---

## ❌ Ошибки и решения

### Ошибка: "Chat not found"
```
❌ Chat не найден. Проверьте Telegram ID: @invaliduser (username)
```
**Решение:** Проверьте что username правильный и пользователь с таким username существует

### Ошибка: "Invalid chat_id"
```
❌ Chat not found или Invalid chat_id
```
**Решение:** Используйте правильный формат:
- Если numeric ID: только цифры (123456789)
- Если username: с @ спереди (@myusername)

### Ошибка: "User not found"
```
Пользователь не существует в Telegram
```
**Решение:** Убедитесь что:
1. Вы сообщили боту команду `/start` (для активации)
2. Username правильный
3. Numeric ID правильный

---

## ✅ Чек-лист

Когда добавляете контакт:
- [ ] Email заполнен
- [ ] Telegram ID заполнен (либо @username либо число)
- [ ] Нет пробелов и спецсимволов (кроме @ для username)
- [ ] Контакт появился в таблице

Когда создаете кампанию:
- [ ] Выбран Telegram канал
- [ ] В консоли видите определение типа ID
- [ ] В PowerShell API видите отправку
- [ ] Сообщение пришло в Telegram ✅

---

## 🎯 Итого

- **@username** → отправляем как есть
- **123456789** → отправляем как число
- **Что-то другое** → отправляем как есть

Система автоматически определит что это и отправит правильно! 🚀
