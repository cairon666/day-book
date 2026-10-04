# Proposal

## Why

Mini App — пока чистый SPA без серверной части. Для функциональности дневника нужны API и БД, а значит — серверный фундамент: модульный монолит с DI и фиксированными правилами, к которому доменные модули добавляются без переделки архитектуры. Сейчас кодовая база минимальна — закладывать каркас дешевле всего.

## What Changes

- Новое приложение `apps/api` (pnpm workspace): **NestJS 11 + TypeScript 5.x strict** — модульный монолит на встроенном DI; структура `config / infrastructure / common / modules` закреплена как правило для доменных модулей.
- **Prisma + PostgreSQL 18**: `schema.prisma`, пустая initial-миграция, `PrismaService` с корректным shutdown; `prisma migrate deploy` выполняется при старте контейнера.
- **Валидация окружения**: env-схема (Zod) проверяется при старте — процесс падает сразу на неверном конфиге, а не первым запросом.
- **Единый контракт ошибок**: глобальный exception filter — все ошибки отдаются в едином JSON-формате.
- **Health-эндпоинт**: `GET /api/health` — liveness + ping БД (`SELECT 1`); публичный, без авторизации.
- **Тесты**: Vitest + supertest, e2e-проверка health.
- **Инфраструктура**: сервис `postgres` (volume + healthcheck) и сервис `api` (`127.0.0.1:8081`, ждёт готовности БД) в `docker-compose.yml`.
- **CI/CD**: сборка второго образа `ghcr.io/<OWNER>/<REPO>/api` (теги `main` + sha), деплой в тот же контур; миграции применяются автоматически.
- **Маршрутизация**: `https://day-book.cairon.ru/api/*` проксируется host-nginx'ом в api-контейнер — тот же origin, CORS для продакшена не нужен.
- **Skills**: проектно-локально устанавливаются agent-skills под стек (nestjs-best-practices, официальные prisma-skills, vitest).

Вне объема (out of scope): авторизация через Telegram `initData` и модуль users, доменные модули дневника, брокер сообщений, Swagger/OpenAPI. Решение на будущее зафиксировано: валидация DTO — `class-validator` (стандарт NestJS).

## Capabilities

### New Capabilities

- `api-core`: каркас API-сервера day-book — старт с валидацией конфигурации, единый формат ошибок, health-проверка с проверкой БД, правила модульной структуры.

### Modified Capabilities

- `deployment`: пайплайн и прод-контур расширяются вторым приложением — образ `api`, сервис `postgres` с постоянным хранением данных, автоматические миграции, маршрутизация `/api/*`. Capability вводится параллельным change `add-mini-app-foundation` (завершён, не архивирован); этот change добавляет требования (ADDED) по тому же пути `deployment`.

## Impact

- **Код**: `apps/api/**` (новое), `docker-compose.yml`, `.github/workflows/deploy.yml`, корневой `package.json` (скрипты `dev:api`/`build`), `.dockerignore`, `.gitignore`, `apps/web/vite.config.ts` (dev-прокси `/api` → `localhost:8081`).
- **Внешние системы**: сервер `/opt/day-book` (новые сервисы в compose, данные postgres в volume, site-конфиг host-nginx: `location /api/` → `127.0.0.1:8081`), GHCR (второй образ), GitHub Actions.
- **Зависимости**: `@nestjs/*` 11, `prisma`/`@prisma/client`, `zod`, `vitest`, `supertest`; TS 5.x локально в `apps/api` (web остаётся на TS 7).
- **Новые секреты/env**: `DATABASE_URL`, `POSTGRES_PASSWORD`, `API_IMAGE`.
