import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Дев-прокси на локальный api (`pnpm dev:api`, слушает 8080 из apps/api/.env):
      // тот же origin, что и в проде (day-book.cairon.ru/api/*), CORS не нужен.
      '/api': 'http://localhost:8080',
    },
  },
})
