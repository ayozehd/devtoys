import { defineConfig } from 'vitest/config';

// Anything touching dates is asserted against UTC so a developer's local
// timezone can never be the reason the suite goes red.
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
  },
});
