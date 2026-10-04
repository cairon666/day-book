import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { parseEnv } from './config/env';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Fail-fast: невалидное окружение должно ронять процесс до открытия порта.
  const env = parseEnv(process.env);

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen(env.PORT);
}

void bootstrap();
