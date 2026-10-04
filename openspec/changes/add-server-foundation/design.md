# Design

## Context

Репозиторий: pnpm workspace `apps/*`, пока только `apps/web` (SPA, деплой nginx-контейнером на `127.0.0.1:8080`). CI: GitHub Actions → GHCR → SSH-деплой в `/opt/day-book`. TLS терминирует host-nginx. Требования заказчика каркаса: Node.js, PostgreSQL, модульный монолит, DI, зафиксированные правила; брокер сообщений исключён. Мотивация — в `proposal.md`, требования — в `specs/`.

## Goals / Non-Goals

**Goals:**

- Каркас, к которому доменные модули добавляются по одному правилу без архитектурных решений каждый раз.
- Вся инфраструктура (БД, миграции, второй образ, маршрутизация) решается один раз и дальше работает сама.
- Единый DX локально: `pnpm dev` поднимает и web, и api, и postgres.

**Non-Goals:**

- Авторизация (`initData`), доменные модули, Swagger — следующие изменения.
- Брокер сообщений; структура Nest-модулей совместима с добавлением BullMQ позже без переделки.
- Zero-downtime деплой и миграции без простоев.

## Decisions

1. **NestJS 11 на стандартном Express-адаптере.** Требование «DI + правила + модульный монолит» покрывается встроенным: модули = границы доменов, guards/pipes/interceptors = правила. Fastify-адаптер дал бы производительность, не нужную TMA, ценой лишней переменной. Альтернатива «Fastify + awilix» отвергнута: весь каркас правил пришлось бы изобретать и поддерживать самому.
2. **Правила модульной структуры.** Один домен = один каталог `src/modules/<domain>/` c файлами `*.module.ts`, `*.service.ts`, `*.controller.ts`. Модуль экспортирует наружу только публичный сервис через `exports`; импорт чужого модуля — только по его публичному API; Prisma не импортируется напрямую из доменных сервисов `@Module`-ами, а через глобальный `PrismaModule`. Infrastructure (`config`, `infrastructure/prisma`, `common`) не зависит от доменов. Эти правила фиксируются в `apps/api/AGENTS.md`.
3. **Prisma, `PrismaService` обёрткой над `PrismaClient`.** `onModuleDestroy` → `$disconnect` (требование корректного завершения). Миграции — declarative `prisma migrate`; в каркасе одна пустая initial-миграция, доказывающая конвейер.
4. **TypeScript 5.x локально в `apps/api`.** Decorator metadata (`emitDecoratorMetadata`) — основа NestJS-DI; web живёт на TS 7 (tsgo), но экосистема Nest проверена на 5.x. Версия локальна для пакета, конфликтов в workspace нет.
5. **Env-валидция на Zod до bootstrap Nest.** Схема `src/config/env.ts` парсит `process.env`; ошибка — понятный список полей, процесс падает до открытия порта (спека «Проверка окружения»). `class-validator` закреплён для DTO будущих эндпоинтов (стандарт Nest, `ValidationPipe`); в каркасе реальных DTO нет, зависимость не добавляем.
6. **Миграции при старте контейнера.** Entrypoint Dockerfile: `npx prisma migrate deploy && node dist/main.js`. Идемпотентно, не требует шага в CI/SSH. Альтернативы (отдельный migrate-job в compose, миграции в пайплайне) сложнее и добавляют состояние в CI.
7. **Порты и маршрутизация.** api слушает 8080 в контейнере, проброшен на `127.0.0.1:8081` (8080 занят web). Прод: host-nginx `location /api/ → 127.0.0.1:8081` — тот же origin, CORS не нужен вовсе. Dev: `apps/web/vite.config.ts` проксирует `/api` → `http://localhost:8081`.
8. **PostgreSQL 18-alpine в compose.** Volume `pgdata`, healthcheck `pg_isready`, api стартует по `depends_on: condition: service_healthy`. Пароль/`DATABASE_URL` — через `.env` рядом с compose (сервер) и `apps/api/.env.local` (dev, в gitignore).
9. **Vitest + supertest вместо Jest.** Один рантайм тестов с web на будущее, быстрее холодный старт. e2e поднимает Nest-приложение через `Test.createTestingModule` и бьёт по `/api/health` через supertest; БД в e2e — локальный postgres из compose.
10. **Skills под стек — проектно-локально.** `npx skills add` (без `-g`): `kadajett/agent-nestjs-skills@nestjs-best-practices`, `prisma/skills@prisma-database-setup`, `@prisma-client-api`, `@prisma-postgres`, `antfu/skills@vitest`. Версионруются в репо, помогают агенту соблюдать правила стека.

## Risks / Trade-offs

- [Пауза на миграции при каждом старте контейнера] → секунды на текущем объёме; приемлемо, устраняется отдельным шагом деплоя позже.
- [Prisma не делает downgrade-миграции] → откат приложения по sha-тегу образа безопасен только если миграция обратно совместима; правило: не писать деструктивные миграции «впритык», проверять `migrate diff` перед пушем.
- [Второй образ в GHCR и пароль postgres в server-`.env`] → доступ к образу тем же `docker login`; `.env` уже вне git и контекста сборки (`dockerignore`/`gitignore`).
- [Одновременный деплой web+api одним пайплайном] → сборка обоих образов в одном job: падение любого блокирует деплой (соответствует спеке).
- [Расхождение TS-версий web (7) и api (5)] → осознанно, изолировано пакетами; пересмотрим при зрелой поддержке decorator metadata в tsgo.

## Migration Plan

Разворот: локально `docker compose up -d postgres` → `pnpm --filter api prisma migrate dev` → `pnpm dev:api`; на сервере — пуш в `main` (пайплайн соберёт `api`-образ, `docker compose pull && up -d` поднимет `postgres` + `api`, миграции применятся при старте). Однократные ручные шаги: `.env` на сервере (`API_IMAGE`, `DATABASE_URL`, `POSTGRES_PASSWORD`), `location /api/` в site-конфиге nginx. Откат: образ по sha-тегу (`API_IMAGE=...:<sha>` и `up -d`); откат схемы БД — вручную (`prisma migrate resolve`), см. риски.
