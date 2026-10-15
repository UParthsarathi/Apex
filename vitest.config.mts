import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./', import.meta.url)) }] },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['lib/**'], exclude: ['lib/utils.ts'], thresholds: { lines: 90 } },
  },
});
