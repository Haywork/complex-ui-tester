import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.test.ts'],
    // Each test file runs in its own process because build-parity.test.ts
    // performs file I/O and dynamic imports that must be isolated.
    pool: 'forks',
  },
});
