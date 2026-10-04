# day-book API — правила

Модульный монолит на NestJS + Prisma + PostgreSQL. Правила ниже обязательны для всех изменений в `apps/api`.

## Структура

```
src/
  main.ts                      — bootstrap: env-валидация → Nest
  app.module.ts                — корневой модуль (только импорты)
  config/                      — env-схема (zod), типизированный конфиг
  common/                      — фильтры/гварды/интерсепторы/пайпы (сквозное)
  infrastructure/prisma/       — PrismaModule + PrismaService (глобальные)
  modules/<domain>/            — доменные модули (health, users, ...)
prisma/                        — schema.prisma + migrations
test/                          — e2e-спеки (*.e2e-spec.ts)
```

## Модули

- Один домен = один каталог `modules/<domain>/`: `<domain>.module.ts`, `<domain>.service.ts`, `<domain>.controller.ts` (+ dto/ при появлении эндпоинтов с телом).
- Наружу модуль экспортирует только публичный сервис (`exports` в `@Module`). Импорт чужого модуля — только ради его публичного API; до внутренностей (контроллеры, приватные провайдеры) не тянемся.
- Домен-домен зависимости допустимы только через импорт модуля; никаких `@Inject('строка')` кроме объявленных токенов в `common/`.
- `config`, `common`, `infrastructure` НЕ импортируют домены. Домены могут импортировать всё.
- `PrismaModule` глобальный: `PrismaService` инжектится конструктором, без импорта модуля в каждом домене.

## Правила кода

- DI — только конструктор-инъекция с типами; сервис-локатор (`module.get` вне тестов) запрещён.
- Валидация DTO — `class-validator` + глобальный `ValidationPipe` (добавляются с первым эндпоинтом с телом запроса). Схемы env — только zod в `src/config/`.
- Сервисы бросают `HttpException`-подклассы (`NotFoundException` и т.п.); формат ответа всегда приводит глобальный фильтр `{statusCode, message, error}`. Стектрейсы/SQL наружу не отдаются.
- Все эндпоинты живут под префиксом `/api` (глобальный, не указывать в `@Controller`).
- Миграции — только через `prisma migrate dev` (локально) / `prisma migrate deploy` (контейнер); схему не меняем в прод вручную. Деструктивные миграции — только после проверки `prisma migrate diff`.

## Тесты

- Юнит-тесты — рядом с файлом (`*.spec.ts`), e2e — в `test/*.e2e-spec.ts` (Vitest + supertest, поднимается через `Test.createTestingModule`).
- Сценарии спек (`openspec/changes/*/specs/`) отражаются в тестах: новый сценарий = тест.
- Перед коммитом: `pnpm --filter api test` и `pnpm --filter api build` зелёные.
