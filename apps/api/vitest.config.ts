import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    env: {
      // Тесты без реального конфига не должны падать на env-валидации:
      // базовая схема подставляется в самих спеках при необходимости.
      NODE_ENV: 'test',
    },
  },
  // esbuild не поддерживает emitDecoratorMetadata — нужен SWC для NestJS-DI в тестах.
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
