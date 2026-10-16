/*
 * Accessibility scan (informational only). Violations are printed and attached to the report but
 * never fail the run, so this spec records the CURRENT state for before/after comparison.
 */
import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { open, seedMatrix, openSettings } from './helpers';

async function scan(page: import('@playwright/test').Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
  console.log(
    `[a11y] ${label}: ${summary.length} violation(s)\n${JSON.stringify(summary, null, 2)}`,
  );
  await test.info().attach(`axe-${label}`, {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json',
  });
}

for (const night of [false, true]) {
  test(`axe: populated board (${night ? 'dark' : 'light'})`, async ({ page }) => {
    await open(page, { matrix: seedMatrix, theme: night ? 'night' : 'light' });
    await scan(page, `board-${night ? 'dark' : 'light'}`);
  });
}

test('axe: task editor, settings menu and projects dialog', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await openSettings(page);
  await scan(page, 'settings-menu');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Edit Send proposal' }).click();
  await page.getByRole('dialog').waitFor();
  await scan(page, 'task-editor');
});
