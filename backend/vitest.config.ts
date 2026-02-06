import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 60000, // 60s for E2E tests against blockchain
    hookTimeout: 60000,
    // Load environment variables
    setupFiles: ['./vitest.setup.ts'],
  },
});
