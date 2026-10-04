import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * Единственная точка доступа к БД. Глобальный провайдер (PrismaModule):
 * инжектится конструктором в доменные сервисы.
 *
 * Строка подключения берётся из DATABASE_URL — её валидность
 * гарантирована env-схемой до bootstrap (src/config/env.ts).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
