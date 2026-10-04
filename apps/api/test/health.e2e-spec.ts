import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HealthService } from '../src/modules/health/health.service';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let healthService: HealthService;

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgresql://daybook:daybook@localhost:5432/daybook';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    healthService = app.get(HealthService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health: приложение и БД доступны → 200 ok/up', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('GET /api/health: БД недоступна → 503, статус базы не up', async () => {
    const spy = vi.spyOn(healthService, 'pingDatabase').mockResolvedValue(false);

    const response = await request(app.getHttpServer()).get('/api/health').expect(503);

    expect(response.body.database).not.toBe('up');
    spy.mockRestore();
  });
});
