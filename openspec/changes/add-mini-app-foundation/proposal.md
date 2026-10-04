# Proposal

## Why

Проект day-book задуман как Telegram Mini App. Нужен фундамент: работающее приложение, открываемое кнопкой в боте по адресу `https://day-book.cairon.ru`, и полностью автоматизированный деплой на собственный сервер. Фундамент уже спланирован и реализован (этап «Привет»); этот change фиксирует его в спецификациях как контракт на будущее развитие.

## What Changes

- Добавлен фронтенд `apps/web` (Vite + React + TypeScript, pnpm workspace) со страницей «Привет!» — заглушка для будущей функциональности дневника.
- Приложение упаковано в Docker: многостадийная сборка (node/pnpm → nginx), контейнер отдаёт статику на `127.0.0.1:8080` с SPA-фоллбэком и кэшированием хэшированных ассетов.
- Добавлен CI/CD (GitHub Actions): push в `main` → сборка образа → публикация в GHCR → деплой на сервер по SSH (`docker compose pull && up -d`).
- Зафиксированы операционные требования к окружению: TLS терминируется nginx'ом на хосте сервера, вход в Mini App — через Menu Button бота.
- Секреты (`.env` с `TELEGRAM_TOKEN`) исключены из git и образа.

Вне объема (out of scope): интеграция TMA SDK (`telegram-web-app.js`), авторизация через `initData`, бэкенд/API, БД, брокеры сообщений — отдельные будущие изменения.

## Capabilities

### New Capabilities

- `mini-app`: фронтенд Telegram Mini App — доступность через кнопку бота по HTTPS, отображение страницы-приветствия, SPA-поведение и кэширование статики.
- `deployment`: контейнерная сборка и автоматический деплой — пайплайн из репозитория в продакшн, поведение контейнера на сервере, защита секретов.

### Modified Capabilities

(нет — существующих спек в проекте нет)

## Impact

- **Код**: `apps/web/**`, `package.json`, `pnpm-workspace.yaml`, `docker-compose.yml`, `.github/workflows/deploy.yml`, `.gitignore`, `.dockerignore` (всё уже реализовано, коммит `782852f`).
- **Внешние системы**: собственный сервер (`/opt/day-book`, docker, host-nginx проксирует `day-book.cairon.ru` → `127.0.0.1:8080`), GitHub (репозиторий, secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`; GHCR), BotFather (домен и Menu Button), Telegram.
- **Зависимости**: React 19, Vite 8, TypeScript 7, nginx (образ), node 22 (стадия сборки).
- Ручные операционные шаги (GitHub repo/secrets, подготовка сервера, nginx site-конфиг, привязка бота в BotFather) описаны в tasks и выполняются вне кода.
