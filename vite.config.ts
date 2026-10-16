import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'client-dist',
    assetsInlineLimit: 1000000,
    cssCodeSplit: false,
    // The size budget in scripts/check-size.mjs is the real guard; this only quiets Vite's 500 kB default.
    chunkSizeWarningLimit: 600,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
