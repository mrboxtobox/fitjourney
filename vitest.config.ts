import { defineConfig } from 'vitest/config';

// Engine/guard tests are pure TypeScript — no JSX, no DOM. Keeping them out of
// vite.config.ts avoids the nested-vite type clash between vite and vitest.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
