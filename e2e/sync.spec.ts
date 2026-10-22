/* Cross-tab storage sync and storage failure handling. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, storedMatrix, toast, editorDialog, MATRIX_KEY, FROZEN } from './helpers';

test('a change in one tab shows up in another tab when no dialog is open', async ({
  page,
  context,
}) => {
  await open(page, { matrix: seedMatrix });
  const second = await context.newPage();
  await second.clock.setFixedTime(FROZEN + 'Z');
  await second.goto('/');
  await expect(second.locator('.task')).toHaveCount(7);

  await page.getByRole('button', { name: 'Add a task to Schedule' }).click();
  const dialog = editorDialog(page);
  await dialog.getByPlaceholder('What do you need to do?').fill('Synced across tabs');
  await dialog.getByRole('button', { name: 'Save task' }).click();

  await expect(second.getByRole('button', { name: 'Edit Synced across tabs' })).toBeVisible();
  await expect(second.locator('.task')).toHaveCount(8);

  // And the other direction: complete a task in the second tab.
  await second.getByRole('checkbox', { name: 'Complete Pay invoice' }).click();
  await expect(page.getByRole('button', { name: 'Edit Pay invoice' })).toHaveCount(0);
  await expect(page.locator('.task')).toHaveCount(7);
  // Receiving a change raises no toast of its own: each tab still shows only its own last action.
  await expect(toast(page)).toContainText('Task added.');
  await expect(toast(second)).toContainText('Task updated.');
});

test('external changes wait while a dialog is open in the receiving tab, then apply', async ({
  page,
  context,
}) => {
  await open(page, { matrix: seedMatrix });
  const second = await context.newPage();
  await second.clock.setFixedTime(FROZEN + 'Z');
  await second.goto('/');
  await expect(second.locator('.task')).toHaveCount(7);

  await second.getByRole('button', { name: 'Add a task to Do first' }).click();
  await expect(editorDialog(second)).toBeVisible();

  await page.getByRole('checkbox', { name: 'Complete Scroll the feed' }).click();
  await expect(page.locator('.task')).toHaveCount(6);
  await expect.poll(async () => (await storedMatrix(page)).tasks.at(-1).id).toBe('t-feed');

  // Give the storage event time to arrive; the tab with the dialog must not have applied it.
  await second.waitForTimeout(500);
  await expect(second.locator('.task')).toHaveCount(7);
  await editorDialog(second).getByRole('button', { name: 'Cancel' }).click();
  await expect(editorDialog(second)).toBeHidden();
  // The held change is applied as soon as the dialog closes.
  await expect(second.locator('.task')).toHaveCount(6);
  await page.getByRole('checkbox', { name: 'Complete Pay invoice' }).click();
  await expect(second.locator('.task')).toHaveCount(5);
});

test('an invalid value written by another tab shows a toast and keeps the board', async ({
  page,
  context,
}) => {
  await open(page, { matrix: seedMatrix });
  const second = await context.newPage();
  await second.goto('/');
  await second.evaluate((key) => localStorage.setItem(key, '{"tasks": 12}'), MATRIX_KEY);
  await expect(toast(page)).toContainText('Changes in another tab could not be read.');
  await expect(page.locator('.task')).toHaveCount(7);
});

test('corrupt stored JSON shows the unreadable-storage toast and blocks overwriting', async ({
  page,
}) => {
  await open(page, { rawMatrix: '{this is not json', tutorialSeen: true });
  await expect(toast(page)).toContainText(
    'Saved tasks could not be read. Export or recover your browser data before making changes.',
  );
  await expect(page.locator('.task')).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#settingsMenu').getByRole('alert')).toHaveText(
    'Storage unavailable. Export to save.',
  );
  await page.keyboard.press('Escape');

  // Changes are allowed in memory but must not overwrite the unreadable data.
  await page.getByRole('button', { name: 'Add your first task' }).click();
  await editorDialog(page).getByPlaceholder('What do you need to do?').fill('In memory only');
  await editorDialog(page).getByRole('button', { name: 'Save task' }).click();
  await expect(page.getByRole('button', { name: 'Edit In memory only' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), MATRIX_KEY)).toBe(
    '{this is not json',
  );
});

test('schema-invalid stored data is treated as unreadable too', async ({ page }) => {
  await open(page, {
    rawMatrix: JSON.stringify({ version: 2, tasks: [{ id: 'x' }], projects: [] }),
  });
  await expect(toast(page)).toContainText('Saved tasks could not be read');
  await expect(page.locator('.task')).toHaveCount(0);
});

test('a legacy bare-array stored matrix still loads', async ({ page }) => {
  await open(page, {
    rawMatrix: JSON.stringify([
      {
        id: 'a',
        title: 'Old array task',
        q: 'do',
        done: false,
        notes: '',
        category: '',
        due: '',
        created: 1,
      },
    ]),
  });
  await expect(page.locator('.task-title')).toHaveText(['Old array task']);
  await expect(toast(page)).toHaveCount(0);
});
