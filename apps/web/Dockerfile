# --- сборка ---
FROM node:22-alpine AS build
WORKDIR /repo

RUN corepack enable

# Сначала манифесты — чтобы слой с pnpm install кэшировался
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

RUN pnpm --filter web build

# --- раздача статики ---
FROM nginx:stable-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80
