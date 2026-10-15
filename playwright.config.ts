import { defineConfig } from '@playwright/test';
import { globSync } from 'node:fs';

// Use a preinstalled Chromium when one exists (or CHROMIUM_PATH); otherwise Playwright's own.
const executablePath =
  process.env.CHROMIUM_PATH ??
  globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1);

const shared = {
  browserName: 'chromium' as const,
  colorScheme: 'light' as const,
  reducedMotion: 'reduce' as const,
  locale: 'en-US',
  timezoneId: 'UTC',
  launchOptions: {
    executablePath,
    args: [
      '--force-color-profile=srgb',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--disable-lcd-text',
      '--disable-skia-runtime-opts',
      '--disable-partial-raster',
    ],
  },
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8000',
    trace: 'off',
  },
  webServer: {
    command: 'npm run build && node scripts/serve.mjs',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...shared, viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...shared,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
