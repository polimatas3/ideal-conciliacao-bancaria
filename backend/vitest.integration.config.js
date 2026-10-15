import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.js'],
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/conciliacao_test',
    },
  },
})
