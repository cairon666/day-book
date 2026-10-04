# day-book

Telegram Mini App «Day Book» — открывается кнопкой в боте Telegram по адресу
`https://day-book.cairon.ru`.

## Стек

- **Frontend:** Vite + React + TypeScript (`apps/web`, pnpm workspace)
- **Backend:** NestJS 11 + Prisma 7 + PostgreSQL 18 (`apps/api`) — модульный монолит
- **Инфраструктура:** Docker (nginx для web, node для api), GitHub Actions → GHCR → деплой на сервер по SSH

## Разработка

```bash
pnpm install          # установка зависимостей (включая prisma generate для api)
docker compose up -d postgres   # локальная БД на 127.0.0.1:5432
pnpm dev              # web (vite, :5173) + api (nest --watch, :8080) параллельно
pnpm build            # сборка web + api (проверка типов)
pnpm --filter api test          # тесты api: unit + e2e (нужен запущенный postgres)
pnpm --filter api exec prisma migrate dev   # новая миграция после правки schema.prisma
docker compose up --build       # локальный прогон контейнеров: 127.0.0.1:8080 (web), :8081 (api), :5432 (postgres)
```

Дев-прокси: `apps/web` проксирует `/api` → `http://localhost:8080`, тот же origin,
что и в проде — CORS не нужен.

Конфиг api — `apps/api/.env` (шаблон в `.env.example`): `DATABASE_URL`, `PORT`.

## Деплой

Push в `main` запускает `.github/workflows/deploy.yml`:

1. Сборка образов `ghcr.io/<OWNER>/<REPO>/web` и `ghcr.io/<OWNER>/<REPO>/api`
   и push в GHCR (теги `main` + sha). Упавшая сборка любого образа блокирует деплой.
2. SSH на сервер → `/opt/day-book` → `docker compose pull web api && docker compose up -d`.
3. Контейнер api при старте применяет миграции (`prisma migrate deploy`) и поднимает
   сервер; данные postgres живут в volume `pgdata`.

На сервере рядом с `docker-compose.yml` лежит `.env` с `WEB_IMAGE`, `API_IMAGE`,
`DATABASE_URL`, `POSTGRES_PASSWORD`. Внешний nginx на хосте терминирует TLS:
`day-book.cairon.ru` → `127.0.0.1:8080`, `day-book.cairon.ru/api/*` → `127.0.0.1:8081`.

## Структура

```
apps/web/            — фронтенд (Vite + React + TS)
  Dockerfile         — многостадийная сборка: node/pnpm → nginx
  nginx.conf         — SPA-фоллбэк + кэширование хэшированных ассетов
apps/api/            — API-сервер (NestJS + Prisma + TS): правила в AGENTS.md
  src/config         — env-схема (zod), fail-fast при старте
  src/common         — глобальный exception filter (единый формат ошибок)
  src/infrastructure — PrismaModule/PrismaService (глобальные)
  src/modules/health — GET /api/health: liveness + ping БД
  prisma/            — schema.prisma + миграции
  Dockerfile         — сборка + entrypoint с migrate deploy
docker-compose.yml   — web (127.0.0.1:8080), api (127.0.0.1:8081), postgres (volume pgdata)
.github/workflows/   — CI/CD (оба образа)
.agents/skills/      — agent-skills: nestjs-best-practices, prisma, vitest
```
