# Contributing to Algor Orchestrator

## Архитектура

### Monorepo Structure

```
algor-orchestrator/
├── apps/
│   ├── api/          # NestJS REST API
│   ├── worker/       # BullMQ background jobs
│   └── admin/        # Next.js admin panel
├── packages/
│   ├── db/           # Prisma schema & migrations
│   ├── shared/       # Shared utilities & types
│   └── connectors/   # Channel connectors
```

### Workflow разработки

1. **Создание новой фичи:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Запуск в dev режиме:**
   ```bash
   make dev
   ```

3. **Тестирование:**
   ```bash
   pnpm test
   ```

4. **Коммит изменений:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Husky автоматически запустит lint и typecheck
   ```

### Соглашения

#### Commits

Используем [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - документация
- `refactor:` - рефакторинг
- `test:` - тесты
- `chore:` - обслуживание

#### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Functional components для React
- Async/await вместо callbacks

### Добавление нового канала

1. Создать коннектор в `packages/connectors/src/{channel}.connector.ts`
2. Реализовать интерфейс `IChannelConnector`
3. Добавить в Prisma enum `Channel`
4. Добавить обработчик в worker
5. Добавить webhook endpoint в API
6. Обновить тесты

### Тестирование

```bash
# Unit tests
pnpm test

# API tests
pnpm --filter @algor/api test

# E2E
pnpm --filter @algor/admin test:e2e
```

### Deployment

См. README.md для инструкций по деплою.

