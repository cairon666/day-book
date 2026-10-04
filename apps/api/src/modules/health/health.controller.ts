import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

export type HealthResponse = {
  status: 'ok' | 'error';
  database: 'up' | 'down';
};

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Публичный (без аутентификации) health-эндпоинт. */
  @Get()
  async check(@Res({ passthrough: true }) response: Response): Promise<HealthResponse> {
    const up = await this.health.pingDatabase();
    if (!up) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'error', database: 'down' };
    }
    return { status: 'ok', database: 'up' };
  }
}
