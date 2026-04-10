import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'dist/**',
        'node_modules/**',
        'tests/**',
        'vitest.config.ts',
        'tsup.config.ts',
      ],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
});
