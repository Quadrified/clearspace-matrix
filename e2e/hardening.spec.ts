/* Checks for the audit fixes: recovery export, theme before paint, caching and security headers. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, MATRIX_KEY } from './helpers';

test('Export backup hands back the original unreadable data instead of an empty board', async ({
  page,
}) => {
  await open(page, { rawMatrix: '{"tasks": broken', tutorialSeen: true });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^clearspace-recovery-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await file.path();
  const { readFile } = await import('node:fs/promises');
  expect(await readFile(path, 'utf8')).toBe('{"tasks": broken');
});

test('dark mode is applied before the app first renders, so there is no light flash', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { firstRender: boolean | null }).firstRender = null;
    new MutationObserver((_records, observer) => {
      const root = document.getElementById('root');
      if (root?.firstChild) {
        (window as unknown as { firstRender: boolean }).firstRender =
          document.body.classList.contains('night');
        observer.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await open(page, { theme: 'night', matrix: seedMatrix });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { firstRender: boolean }).firstRender))
    .toBe(true);
});

test('the page revalidates, assets are immutable, and the strict CSP is never violated', async ({
  page,
  request,
}) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await open(page, { matrix: seedMatrix });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Edit labels' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  const html = await request.get('/');
  expect(html.headers()['cache-control']).toBe('no-cache');
  expect(html.headers()['etag']).toBeTruthy();
  expect(html.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  const revalidated = await request.get('/', {
    headers: { 'if-none-match': html.headers()['etag']! },
  });
  expect(revalidated.status()).toBe(304);
  const script = (await html.text()).match(/src="(\/assets\/[^"]+\.js)"/)![1]!;
  expect((await request.get(script)).headers()['cache-control']).toMatch(/immutable/);
  expect(problems).toEqual([]);
});

test('storage keeps its format', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await page.getByRole('checkbox', { name: 'Complete Pay invoice' }).click();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!) as { version: number },
    MATRIX_KEY,
  );
  expect(saved.version).toBe(2);
});
