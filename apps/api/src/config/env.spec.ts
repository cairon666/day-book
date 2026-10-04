import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('падает с именем переменной, если DATABASE_URL отсутствует', () => {
    expect(() => parseEnv({})).toThrowError(/DATABASE_URL/);
  });

  it('падает, если DATABASE_URL не postgres-URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://localhost/db' })).toThrowError(/DATABASE_URL/);
  });

  it('принимает postgresql:// и подставляет значения по умолчанию', () => {
    const env = parseEnv({ DATABASE_URL: 'postgresql://daybook:secret@localhost:5432/daybook' });
    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe('development');
  });

  it('коэрсит PORT из строки', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgresql://daybook:secret@localhost:5432/daybook',
      PORT: '3000',
    });
    expect(env.PORT).toBe(3000);
  });

  it('отклоняет нечисловой PORT', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: 'postgresql://x@localhost:5432/db', PORT: 'abc' }),
    ).toThrowError(/PORT/);
  });
});
