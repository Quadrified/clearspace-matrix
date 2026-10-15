/* UX pass: one-click add, tab counts, filter summary, first-task prompt, date chips, backup state. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, editorDialog, storedMatrix, openFilters } from './helpers';

test('Add task opens the editor in one click and Projects opens the projects dialog', async ({
  page,
}) => {
  await open(page, { matrix: seedMatrix });
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(editorDialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editorDialog(page)).toBeHidden();
  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A place for your projects.' })).toBeVisible();
});

test('status tabs show how many tasks each holds', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.locator('.tabs .tab-count')).toHaveText(['7', '1', '8']);
});

test('the active status tab is a solid highlighted pill', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  const active = page.locator('.tabs button.active');
  await expect(active).toContainText('Active');
  await expect(active.locator('.tab-indicator')).toHaveCSS('background-color', 'rgb(49, 94, 67)');
  await expect(active).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.locator('.tabs button.active')).toContainText('Completed');
  await expect(page.getByRole('button', { name: 'Active', exact: true })).not.toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );
});

test('filtering shows a result count and Clear filters resets it', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.locator('.filter-summary')).toHaveCount(0);
  await openFilters(page);
  await page.getByRole('textbox', { name: 'Find a task' }).fill('health');
  await expect(page.locator('.filter-summary')).toContainText('2 tasks match');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.filter-summary')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Find a task' })).toHaveValue('');
});

test('an empty board offers a first task and examples, and hides the zero stats', async ({
  page,
}) => {
  await open(page, { matrix: { tasks: [], projects: [] } });
  await expect(page.getByRole('region', { name: 'Task overview' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Try example tasks' }).click();
  await expect(page.locator('.task')).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Task overview' })).toBeVisible();
});

test('date chips fill the due date', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const dialog = editorDialog(page);
  await dialog.getByRole('button', { name: 'Tomorrow' }).click();
  await expect(dialog.getByLabel('Due date')).toHaveValue('2026-10-16');
  await dialog.getByRole('button', { name: 'Next week' }).click();
  await expect(dialog.getByLabel('Due date')).toHaveValue('2026-10-22');
  await dialog.getByRole('button', { name: 'No date' }).click();
  await expect(dialog.getByLabel('Due date')).toHaveValue('');
});

test('exporting a backup records it and the footer says so', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.locator('.backup-state')).toHaveText('Last backup: never.');
  await expect(page.locator('.backup-state')).toHaveClass(/due/);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  await download;
  await expect(page.locator('.backup-state')).toHaveText('Last backup: today.');
  expect(
    await page.evaluate(() => Number(localStorage.getItem('clearspace.lastBackup.v1'))),
  ).toBeGreaterThan(0);
  expect((await storedMatrix(page)).tasks).toHaveLength(8);
});

test('overdue tasks carry an icon as well as colour', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.locator('.duedate.overdue svg')).toHaveCount(1);
});

test('the system dark setting is followed until a choice is saved', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/night/);
  await page.getByRole('switch', { name: 'Dark mode' }).click();
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/night/);
  await context.close();
});

test('phones get a floating add button and collapsed filters', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout only');
  await open(page, { matrix: seedMatrix });
  await expect(page.getByRole('textbox', { name: 'Find a task' })).toBeHidden();
  await page.getByRole('button', { name: 'Search and filters' }).click();
  await expect(page.getByRole('textbox', { name: 'Find a task' })).toBeVisible();
  await page.getByRole('button', { name: 'Quick add task' }).click();
  await expect(editorDialog(page)).toBeVisible();
});
