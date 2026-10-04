import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

function createController(ping: () => Promise<boolean>): {
  controller: HealthController;
  status: ReturnType<typeof vi.fn>;
} {
  const status = vi.fn();
  return {
    controller: new HealthController({ pingDatabase: ping } as unknown as HealthService),
    status,
  };
}

describe('HealthController', () => {
  it('200 + {status:"ok", database:"up"} при живой БД', async () => {
    const { controller, status } = createController(vi.fn().mockResolvedValue(true));
    const body = await controller.check({ status } as unknown as Response);
    expect(status).not.toHaveBeenCalled();
    expect(body).toEqual({ status: 'ok', database: 'up' });
  });

  it('503 + статус базы, отличный от up, при мёртвой БД', async () => {
    const { controller, status } = createController(vi.fn().mockResolvedValue(false));
    const body = await controller.check({ status } as unknown as Response);
    expect(status).toHaveBeenCalledWith(503);
    expect(body.database).not.toBe('up');
  });
});
