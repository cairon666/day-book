import { Controller, Get } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/** Контроллер только для e2e: проверка единого формата на необработанной ошибке. */
@Controller('e2e-boom')
class BoomController {
  @Get()
  boom(): never {
    throw new Error('secret internal detail: connection string leaked');
  }
}

describe('Единый формат ошибок (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgresql://daybook:daybook@localhost:5432/daybook';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [BoomController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('неизвестный маршрут под /api → 404 в едином формате', async () => {
    const response = await request(app.getHttpServer()).get('/api/no-such-route').expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: expect.stringContaining('/api/no-such-route') as unknown,
      error: 'Not Found',
    });
  });

  it('запрос вне префикса /api → 404', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('необработанное исключение → 500 без внутренних деталей', async () => {
    const response = await request(app.getHttpServer()).get('/api/e2e-boom').expect(500);
    const payload = JSON.stringify(response.body);

    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    expect(payload).not.toContain('secret');
    expect(payload).not.toContain('stack');
  });
});
