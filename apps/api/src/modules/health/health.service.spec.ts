import { describe, expect, it, vi } from 'vitest';
import { HealthService } from './health.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

function createService(queryRaw: () => Promise<unknown>): HealthService {
  return new HealthService({ $queryRaw: queryRaw } as unknown as PrismaService);
}

describe('HealthService', () => {
  it('возвращает true, когда БД отвечает на SELECT 1', async () => {
    const service = createService(vi.fn().mockResolvedValue([{ 1: 1 }]));
    await expect(service.pingDatabase()).resolves.toBe(true);
  });

  it('возвращает false, когда БД бросает ошибку', async () => {
    const service = createService(vi.fn().mockRejectedValue(new Error('connection refused')));
    await expect(service.pingDatabase()).resolves.toBe(false);
  });
});
