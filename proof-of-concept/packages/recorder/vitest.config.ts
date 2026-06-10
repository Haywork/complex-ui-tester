import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    // Run each test FILE in its own forked process so that console monkey-patching
    // in bridge-console.test.ts and console-capture.test.ts does not bleed across
    // files (the default 'threads' pool shares the global object between files).
    pool: 'forks',
    // The unhandledrejection capture test intentionally creates Promise.reject()
    // inside a PromiseRejectionEvent constructor (the same way a real browser would),
    // causing a Node.js-level unhandled rejection warning. Setting
    // dangerouslyIgnoreUnhandledErrors prevents this from causing a non-zero exit code.
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
