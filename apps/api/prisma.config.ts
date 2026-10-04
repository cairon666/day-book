import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Конфиг Prisma CLI (migrate и т.д.). Строка подключения больше не живёт
// в schema.prisma: CLI берёт её отсюда, рантайм — через adapter
// в конструкторе PrismaClient (см. src/infrastructure/prisma).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
