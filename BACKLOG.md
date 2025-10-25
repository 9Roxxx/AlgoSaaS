# Algor Orchestrator - Backlog & Roadmap

## ✅ Реализовано (MVP)

- [x] Monorepo setup (pnpm + Turborepo)
- [x] Prisma schema со всеми доменными моделями
- [x] NestJS API с модулями: Auth, Contacts, Consents, Campaigns, Templates, Webhooks
- [x] BullMQ Worker с процессорами для отправки
- [x] Коннекторы для всех каналов (Telegram, VK, Email, SMS, WhatsApp)
- [x] YAML-политики с Zod валидацией
- [x] Next.js Admin Panel (базовая структура)
- [x] Docker Compose для локальной разработки
- [x] Seed данные с примерами шаблонов
- [x] Redirect сервис для трекинга кликов
- [x] OpenAPI/Swagger документация

## 🚧 В разработке

### Интеграции с реальными провайдерами

- [ ] **Telegram Bot API**
  - [ ] Настройка Webhook
  - [ ] Обработка команд /start, /stop
  - [ ] Typing indicator
  - [ ] Inline кнопки

- [ ] **VK API**
  - [ ] Callback API setup
  - [ ] Обработка подписок на сообщество
  - [ ] Keyboard buttons
  - [ ] Attachments (фото, документы)

- [ ] **Email (Mailgun/SendGrid)**
  - [ ] Полная настройка Mailgun
  - [ ] SendGrid интеграция
  - [ ] Email templates с CSS
  - [ ] Unsubscribe header
  - [ ] DKIM/SPF validation

- [ ] **SMS провайдер**
  - [ ] Интеграция с локальным агрегатором
  - [ ] DLR обработка
  - [ ] Коды отписки
  - [ ] HLR проверка

- [ ] **WhatsApp BSP**
  - [ ] Twilio интеграция
  - [ ] 360dialog интеграция
  - [ ] GreenAPI интеграция
  - [ ] Template management
  - [ ] Media messages

### Мониторинг и наблюдаемость

- [ ] **Grafana + Prometheus**
  - [ ] Метрики API (req/s, latency, errors)
  - [ ] Метрики Worker (queue depth, processing time)
  - [ ] Метрики БД (connection pool, query time)
  - [ ] Business метрики (sent/delivered/clicked rates)

- [ ] **Sentry**
  - [ ] Error tracking для API
  - [ ] Error tracking для Worker
  - [ ] Error tracking для Admin
  - [ ] Performance monitoring

- [ ] **Logging**
  - [ ] Structured logging (JSON)
  - [ ] ELK Stack / Loki
  - [ ] Request tracing (trace ID)
  - [ ] Audit log

- [ ] **Alerts**
  - [ ] Complaint rate > 0.3%
  - [ ] Undelivered rate > 8%
  - [ ] Queue depth > 10k
  - [ ] API errors > 5%

### Биллинг и квоты

- [ ] **Подсчёт использования**
  - [ ] Счётчики отправок по каналам
  - [ ] Счётчики по арендаторам
  - [ ] Агрегация в ClickHouse
  - [ ] Dashboard использования

- [ ] **Тарифные планы**
  - [ ] Free tier (100 отправок/мес)
  - [ ] Starter (1K отправок/мес)
  - [ ] Growth (10K отправок/мес)
  - [ ] Enterprise (unlimited)

- [ ] **Лимиты и квоты**
  - [ ] Rate limiting по tenant
  - [ ] Soft limits (warning)
  - [ ] Hard limits (block)
  - [ ] Auto top-up

- [ ] **Платёжная интеграция**
  - [ ] Stripe
  - [ ] ЮKassa
  - [ ] Invoicing
  - [ ] Payment history

### Продвинутые фичи

- [ ] **A/B тестирование**
  - [ ] Split campaigns
  - [ ] Variant tracking
  - [ ] Statistical significance
  - [ ] Winner auto-selection

- [ ] **Webhook retry механизм**
  - [ ] Exponential backoff
  - [ ] Dead letter queue
  - [ ] Manual retry UI

- [ ] **Contact deduplication**
  - [ ] Fuzzy matching (phone, email)
  - [ ] Merge contacts UI
  - [ ] Duplicate prevention

- [ ] **Import validation & preview**
  - [ ] CSV schema validation
  - [ ] Preview первых 10 строк
  - [ ] Error highlighting
  - [ ] Rollback import

- [ ] **Template builder UI**
  - [ ] Drag-and-drop редактор
  - [ ] Variable picker
  - [ ] Preview по каналам
  - [ ] Version history

- [ ] **Segment builder UI**
  - [ ] Visual query builder
  - [ ] AND/OR логика
  - [ ] Custom fields
  - [ ] Live count

- [ ] **Advanced reporting**
  - [ ] Funnel analysis
  - [ ] Cohort analysis
  - [ ] Attribution tracking
  - [ ] Export to CSV/Excel

- [ ] **Multi-language (i18n)**
  - [ ] English interface
  - [ ] Шаблоны на разных языках
  - [ ] Timezone support
  - [ ] Currency support

### Безопасность

- [ ] **PII Encryption**
  - [ ] Реализация Prisma middleware
  - [ ] Key rotation
  - [ ] Encryption at rest
  - [ ] Secure key storage (Vault)

- [ ] **RBAC улучшения**
  - [ ] Granular permissions
  - [ ] Resource-based access
  - [ ] API key management
  - [ ] IP whitelist

- [ ] **Audit logging**
  - [ ] User actions log
  - [ ] Data access log
  - [ ] Export audit logs
  - [ ] Retention policy

### DevOps & Infrastructure

- [ ] **CI/CD**
  - [ ] GitHub Actions
  - [ ] Automated tests
  - [ ] Docker build & push
  - [ ] Deploy to staging/prod

- [ ] **Production deployment**
  - [ ] Kubernetes manifests
  - [ ] Helm charts
  - [ ] Auto-scaling
  - [ ] Blue-green deployment

- [ ] **Database**
  - [ ] Read replicas
  - [ ] Connection pooling (PgBouncer)
  - [ ] Backup & restore
  - [ ] Point-in-time recovery

- [ ] **ClickHouse optimization**
  - [ ] Table partitioning
  - [ ] Materialized views
  - [ ] Compression
  - [ ] Retention policies

### Compliance & Legal

- [ ] **GDPR**
  - [ ] Right to be forgotten
  - [ ] Data export
  - [ ] Privacy policy generator
  - [ ] Cookie consent

- [ ] **152-ФЗ расширения**
  - [ ] Consent PDF generator
  - [ ] Electronic signature
  - [ ] Consent archive
  - [ ] Регистрация в Роскомнадзоре

- [ ] **38-ФЗ (Реклама)**
  - [ ] Автоматическая маркировка
  - [ ] Tokens для маркировки
  - [ ] Отчёты для ОРД
  - [ ] Erid integration

## 💡 Идеи на будущее

- [ ] Messengers: Viber, WhatsApp Business Platform
- [ ] Push notifications (FCM, APNs)
- [ ] Voice calls (Twilio, Asterisk)
- [ ] Chatbot builder
- [ ] Journey builder (visual automation)
- [ ] Predictive send time
- [ ] AI-powered content generation
- [ ] Sentiment analysis
- [ ] CDP integration (Customer Data Platform)
- [ ] Zapier/Make.com integration
- [ ] Mobile app для мониторинга

## 📝 Технический долг

- [ ] Добавить unit тесты для всех сервисов (coverage > 80%)
- [ ] E2E тесты для критичных флоу
- [ ] Performance тесты (load testing)
- [ ] Security audit
- [ ] Code review чеклист
- [ ] Documentation improvements
- [ ] Error handling стандартизация
- [ ] Logging стандартизация

---

**Приоритизация:** Следующий спринт фокусируется на интеграции с реальными провайдерами и базовом мониторинге.

