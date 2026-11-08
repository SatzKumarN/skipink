import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['src/main.js'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
});
