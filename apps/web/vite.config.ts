import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts on purpose: tests must not start the Netlify dev emulation.
export default defineConfig({
  test: {
    include: ['netlify/**/*.test.ts'],
    testTimeout: 120_000, // bundling takes a few seconds, longer on a cold CI runner
  },
});
