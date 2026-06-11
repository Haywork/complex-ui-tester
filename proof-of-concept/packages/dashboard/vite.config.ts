import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * src/data.ts uses Node.js built-ins (readFileSync, fileURLToPath) for
 * fixture loading at module level. The browser app uses src/app/dataLayer.ts
 * instead, which replaces readFileSync with a static JSON import.
 *
 * We alias src/data.ts → src/app/dataLayer.ts so that chat.ts (which imports
 * types from ./data.js) also resolves to the browser-safe module.
 */
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Redirect the Node-only data module to the browser-safe equivalent.
      // Both paths must be handled because some imports are relative to src/
      // and some to src/app/.
      [resolve(__dirname, 'src/data.ts')]: resolve(__dirname, 'src/app/dataLayer.ts'),
      [resolve(__dirname, 'src/data.js')]: resolve(__dirname, 'src/app/dataLayer.ts'),
    },
  },
});
