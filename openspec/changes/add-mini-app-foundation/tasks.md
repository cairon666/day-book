# Tasks

> Примечание: кодовая часть (группы 1–3) уже реализована в коммите `782852f`. Задачи этих групп — верификация существующего; группы 4–6 — ручные операции вне репозитория.

## 1. Каркас приложения

- [x] 1.1 Проверить workspace: `pnpm install` проходит без ошибок, существуют `pnpm-workspace.yaml`, `apps/web/package.json`, `pnpm-lock.yaml`
- [x] 1.2 Проверить сборку: `pnpm build` (tsc + vite) завершается успешно, `apps/web/dist/index.html` создан
- [x] 1.3 Проверить страницу: `pnpm dev` — по адресу dev-сервера отображается «Привет!» по центру

## 2. Контейнер

- [x] 2.1 Собрать и запустить локально: `docker compose up --build` → `curl -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/` возвращает 200
- [x] 2.2 Проверить SPA-фоллбэк: запрос `/unknown/route` возвращает 200 и `index.html`; запрос несуществующего файла в `/assets/` возвращает 404
- [x] 2.3 Проверить кэширование: ответ ассета из `/assets/` содержит `Cache-Control: public, max-age=31536000, immutable`
- [x] 2.4 Проверить защиту секретов: `git ls-files | grep .env` пуст; `docker run --rm day-book-web:local ls /usr/share/nginx/html/.env` — файл отсутствует

## 3. CI/CD (репозиторий)

- [x] 3.1 Убедиться, что `.github/workflows/deploy.yml` существует: шаги build → GHCR (теги `main` + sha, lowercase) → SSH-деплой
- [x] 3.2 Убедиться, что `.gitignore` и `.dockerignore` исключают `.env`

## 4. GitHub (вручную)

- [x] 4.1 Создать приватный репозиторий и запушить `main`; проверить, что push принят и `.env` не попал в удалённый репозиторий
- [x] 4.2 Добавить секреты `SSH_HOST`, `SSH_USER`, `SSH_KEY` (Settings → Secrets → Actions)

## 5. Сервер (вручную, однократно)

- [x] 5.1 Подготовить `/opt/day-book`: скопировать `docker-compose.yml`, создать `.env` с `WEB_IMAGE=ghcr.io/<ЛОГИН>/day-book/web:main`
- [x] 5.2 Авторизоваться в GHCR: PAT со scope `read:packages` → `docker login ghcr.io`
- [x] 5.3 Настроить site-конфиг nginx: `proxy_pass http://127.0.0.1:8080` + proxy-заголовки; `nginx -t` без ошибок, reload
- [x] 5.4 Убедиться, что порт 8080 свободен до первого деплоя (иначе сменить порт в compose и nginx)

## 6. BotFather (вручную, однократно)

- [x] 6.1 Bot Settings → Domain → `day-book.cairon.ru`
- [x] 6.2 Bot Settings → Menu Button → `https://day-book.cairon.ru`

## 7. Интеграционная проверка

- [x] 7.1 Сделать push в `main` → пайплайн GitHub Actions зелёный; образ с тегами `main` и sha появился в GHCR
- [x] 7.2 Открыть `https://day-book.cairon.ru` → отображается «Привет!»
- [x] 7.3 Открыть бота в Telegram (iOS/Android) → Menu Button → приложение открывается внутри Telegram
- [x] 7.4 Перезапустить контейнер на сервере (`docker restart`) → приложение снова отвечает (автовосстановление)
