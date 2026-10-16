import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-dev-access',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/dev/status' || req.url === '/api/dev/tasks') {
            res.statusCode = req.url.endsWith('tasks') ? 403 : 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify(
                req.url.endsWith('tasks')
                  ? { error: 'Dev sign-in is available on the hosted Site only.' }
                  : { authorized: false },
              ),
            );
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    outDir: 'client-dist',
    assetsInlineLimit: 1000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
