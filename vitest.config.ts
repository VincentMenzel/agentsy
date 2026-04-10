import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      branches: 100,
      exclude: ['dist/**', 'node_modules/**', 'tests/**', 'vitest.config.ts', 'tsup.config.ts'],
      functions: 100,
      include: ['src/**/*.ts'],
      lines: 100,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      statements: 100,
    },
    include: ['tests/**/*.test.ts'],
  },
});
