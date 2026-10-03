# day-book

Telegram Mini App «Day Book» — открывается кнопкой в боте Telegram по адресу
`https://day-book.cairon.ru`.

## Стек

- **Frontend:** Vite + React + TypeScript (`apps/web`, pnpm workspace)
- **Инфраструктура:** Docker (nginx отдаёт статику), GitHub Actions → GHCR → деплой на сервер по SSH

## Разработка

```bash
pnpm install          # установка зависимостей
pnpm dev              # vite dev server
pnpm build            # проверка типов + production-сборка
docker compose up --build   # локальный прогон контейнера (127.0.0.1:8080)
```

## Деплой

Push в `main` запускает `.github/workflows/deploy.yml`:

1. Сборка образа `ghcr.io/<OWNER>/<REPO>/web` и push в GHCR (теги `main` + sha).
2. SSH на сервер → `/opt/day-book` → `docker compose pull && docker compose up -d`.

На сервере рядом с `docker-compose.yml` лежит `.env` с `WEB_IMAGE=ghcr.io/<OWNER>/<REPO>/web:main`.
Внешний nginx на хосте терминирует TLS и проксирует `day-book.cairon.ru` → `127.0.0.1:8080`.

## Структура

```
apps/web/            — приложение (Vite + React + TS)
  Dockerfile         — многостадийная сборка: node/pnpm → nginx
  nginx.conf         — SPA-фоллбэк + кэширование хэшированных ассетов
docker-compose.yml   — контейнер web на 127.0.0.1:8080
.github/workflows/   — CI/CD
```
