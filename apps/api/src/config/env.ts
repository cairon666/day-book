import { z } from 'zod';

const POSTGRES_URL = /^postgres(ql)?:\/\//;

/**
 * Схема окружения приложения. Проверяется ДО bootstrap Nest:
 * при невалидном значении процесс падает, не открывая порт.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z
    .string({ error: 'обязательная переменная окружения (строка подключения к PostgreSQL)' })
    .min(1, 'обязательна строка подключения к PostgreSQL')
    .refine((value) => POSTGRES_URL.test(value), {
      message: 'ожидается URL вида postgresql://user:password@host:port/db',
    }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    throw new Error(`Невалидная конфигурация окружения:\n${lines.join('\n')}`);
  }
  return result.data;
}
