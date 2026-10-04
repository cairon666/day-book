# --- сборка ---
FROM node:22-alpine AS build
WORKDIR /repo

RUN corepack enable

# Сначала манифесты — чтобы слой с pnpm install кэшировался
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api

# Клиент Prisma генерируется в src/generated (нужен на этапе tsc)
RUN pnpm --filter api exec prisma generate \
  && pnpm --filter api build

# Изолированный prod-контур пакета api (без dev-зависимостей).
# --legacy: у api нет workspace-зависимостей, injected-режим не нужен.
RUN pnpm --filter api --prod deploy --legacy /out \
  && cp -R apps/api/dist /out/dist \
  && cp -R apps/api/prisma /out/prisma \
  && cp apps/api/prisma.config.ts /out/prisma.config.ts

# --- рантайм ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /out ./

USER node
EXPOSE 8080

# Миграции применяются идемпотентно при каждом старте, затем поднимается сервер
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]
