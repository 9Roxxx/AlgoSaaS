.PHONY: help install dev build test up down logs clean db-migrate db-seed

help: ## Показать помощь
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости
	pnpm install

dev: ## Запустить dev режим всех сервисов
	pnpm dev

build: ## Собрать все пакеты
	pnpm build

test: ## Запустить тесты
	pnpm test

up: ## Поднять Docker-контейнеры
	docker compose up -d

down: ## Остановить Docker-контейнеры
	docker compose down

logs: ## Показать логи Docker-контейнеров
	docker compose logs -f

clean: ## Очистить зависимости и артефакты
	pnpm clean

db-migrate: ## Применить миграции БД
	pnpm db:migrate

db-seed: ## Наполнить БД тестовыми данными
	pnpm seed

db-studio: ## Открыть Prisma Studio
	pnpm db:studio

setup: install up db-migrate db-seed ## Полная настройка проекта
	@echo "✅ Проект готов к работе!"
	@echo "Запустите 'make dev' для старта разработки"

lint: ## Линтинг кода
	pnpm lint

format: ## Форматирование кода
	pnpm format

