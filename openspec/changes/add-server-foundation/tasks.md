# Tasks

## 1. Подготовка: skills и каркас пакета

- [x] 1.1 Установить skills: `npx skills add kadajett/agent-nestjs-skills@nestjs-best-practices`, `npx skills add prisma/skills@prisma-database-setup`, `npx skills add prisma/skills@prisma-client-api`, `npx skills add prisma/skills@prisma-postgres`, `npx skills add antfu/skills@vitest` — проверить, что скиллы появились в проекте (`.agents/skills/` или `.opencode/skills/`) и закоммитить
- [x] 1.2 Создать пакет `apps/api` (NestJS 11, Express-адаптер, TS 5.x strict, ESM-совместимость по конвенциям Nest): `package.json`, `tsconfig.json`, `nest-cli.json`, `vitest.config.ts`; `pnpm install` проходит, `pnpm --filter api build` собирает `dist/main.js`

## 2. Ядро приложения

- [x] 2.1 Реализовать env-схему `src/config/env.ts` (Zod: `DATABASE_URL`, `PORT`); проверить: запуск без `DATABASE_URL` завершается с ненулевым кодом и именем переменной в выводе, порт не открывается
- [x] 2.2 Собрать `src/main.ts` + `src/app.module.ts`: глобальный префикс `/api`, CORS выключен, graceful shutdown (`app.enableShutdownHooks`); проверить: `GET /api/ping-времянки` вне существующих роутов даёт 404, SIGTERM завершает процесс без ошибок
- [x] 2.3 Добавить глобальный exception filter `src/common/` — единый JSON-формат `{statusCode, message, error}` для 404/500/необработанных исключений; unit-тест фильтра (e2e-проверка формата — в 3.4) проходит, стектрейс в ответе отсутствует
- [x] 2.4 Зафиксировать правила модульной структуры в `apps/api/AGENTS.md` (один домен = один `modules/<domain>/`, публичный API через `exports`, infrastructure не зависит от доменов); файл закоммичен и упоминает `class-validator` как стандарт DTO

## 3. БД и health

- [x] 3.1 Инициализировать Prisma: `prisma/schema.prisma` (datasource postgresql, generator client), `src/infrastructure/prisma/` c `PrismaModule` (глобальный) и `PrismaService` (`$disconnect` в `onModuleDestroy`); создать initial-миграцию `prisma migrate dev --name init` против локального postgres (группа 4.1) — `prisma/migrations/` закоммичена
- [x] 3.2 Реализовать `modules/health/`: `GET /api/health` — 200 `{status:"ok", database:"up"}` при живой БД (ping через `PrismaService`), 503 при недоступной; unit-тесты сценариев спеки (живая/мёртвая БД) проходят
- [x] 3.3 Настроить e2e-инфраструктуру: Vitest + supertest через `Test.createTestingModule`; e2e-спеки health и единого формата ошибок (404 вне префикса, 500 без стектрейса) проходят против локального postgres
- [x] 3.4 Прогнать весь набор: `pnpm --filter api test` зелёный (unit + e2e)

## 4. Локальная инфраструктура

- [x] 4.1 Расширить `docker-compose.yml`: сервис `postgres` (postgres:18-alpine, volume `pgdata`, healthcheck `pg_isready`) и сервис `api` (build `apps/api`, `127.0.0.1:8081:8080`, `depends_on: service_healthy`, `DATABASE_URL` из env); `docker compose up` поднимает стек, `curl http://127.0.0.1:8081/api/health` возвращает 200
- [x] 4.2 Написать `apps/api/Dockerfile`: многостадийная сборка (манифесты + `--frozen-lockfile` → исходники → prisma generate → dist), runtime-образ с entrypoint `npx prisma migrate deploy && node dist/main.js`; локальная пересборка контейнера сохраняет данные в volume, health после рестарта — 200 без повторного применения initial-миграции
- [x] 4.3 Настроить dev-DX: `apps/web/vite.config.ts` прокси `/api` → `http://localhost:8081`; `apps/api/.env.example` (DATABASE_URL, PORT); корневые скрипты `dev:api` и общий `dev`/`build` в `package.json`; проверить: `pnpm dev` (web+api) — фронт достаёт `/api/health` через прокси без CORS-ошибок в консоли

## 5. CI/CD

- [x] 5.1 Расширить `.github/workflows/deploy.yml`: сборка и push образа `ghcr.io/<owner>/<repo>/api` (теги `main` + sha) в том же job до SSH-шага; SSH-скрипт: `docker compose pull web api && docker compose up -d`; упавшая сборка api блокирует деплой (проверить на ветке/форсе неудачной сборки или убедиться в `set -e` порядке шагов)
- [x] 5.2 Проверить защиту секретов: `.gitignore`/`.dockerignore` покрывают `apps/api/.env*` (кроме `.example`); `git ls-files | grep -E '^apps/api/.*\.env$'` пуст

## 6. Сервер (вручную, однократно)

- [ ] 6.1 Обновить `/opt/day-book/.env`: `API_IMAGE=ghcr.io/<ЛОГИН>/day-book/api:main`, `DATABASE_URL=postgresql://daybook:<пароль>@postgres:5432/daybook`, `POSTGRES_PASSWORD`; скопировать обновлённый `docker-compose.yml`
- [ ] 6.2 Добавить в site-конфиг host-nginx `location /api/ { proxy_pass http://127.0.0.1:8081; }` (с proxy-заголовками); `nginx -t` без ошибок, reload
- [ ] 6.3 Проверить, что порт 8081 на сервере свободен (иначе сменить маппинг в compose и nginx)

## 7. Интеграционная проверка

- [ ] 7.1 Push в `main` → пайплайн зелёный, в GHCR появились оба образа с тегами `main` + sha
- [ ] 7.2 `curl https://day-book.cairon.ru/api/health` → 200 `{"status":"ok","database":"up"}`; подключение к 8081 извне сервера недоступно
- [ ] 7.3 `docker compose restart api` на сервере → health снова 200, данные в postgres сохранились (миграция не выполняется повторно — видно в логах)
- [x] 7.4 Обновить корневой `README.md` (стек: + api/postgres, команды dev, структура) — указанные в нём команды выполняются как написано
