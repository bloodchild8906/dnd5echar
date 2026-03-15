import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    alias: {
      'virtual:pwa-register/react': new URL(
        './src/__mocks__/virtual-pwa-register.ts',
        import.meta.url
      ).pathname,
    },
  },
});
