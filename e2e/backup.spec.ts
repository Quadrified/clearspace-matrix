/* Export backup download and Import (valid, legacy v1, invalid) . */
import { test, expect } from '@playwright/test';
import { openSettings, open, seedMatrix, storedMatrix, toast } from './helpers';

const IMPORT_ERROR =
  'This backup could not be imported. Check that it is a Clearspace JSON backup.';
const task = (o: Record<string, unknown>) => ({
  owner: '',
  notes: '',
  category: '',
  due: '',
  done: false,
  created: 9000,
  ...o,
});

test('Export backup downloads a v2 JSON file with the whole board', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await openSettings(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export backup' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('clearspace-2026-10-15.json');
  const path = await download.path();
  const { readFile } = await import('node:fs/promises');
  const body = JSON.parse(await readFile(path, 'utf8'));
  expect(body.version).toBe(2);
  expect(body.tasks).toHaveLength(8);
  expect(body.projects).toEqual(seedMatrix.projects);
  expect(body.tasks.map((t: { id: string }) => t.id)).toEqual(seedMatrix.tasks.map((t) => t.id));
  await expect(toast(page)).toContainText('Backup exported.');
});

test('Import merges a valid v2 backup (and remaps same-named projects)', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  const backup = {
    version: 2,
    projects: [
      { id: 'other-launch', name: 'launch' },
      { id: 'p-new', name: 'Brand new' },
    ],
    tasks: [
      task({ id: 'i-1', title: 'Imported into Launch', q: 'schedule', projectId: 'other-launch' }),
      task({
        id: 'i-2',
        title: 'Imported into Brand new',
        q: 'delegate',
        projectId: 'p-new',
        category: 'Work',
      }),
      task({ id: 't-feed', title: 'Scroll the feed (overwritten)', q: 'eliminate' }),
    ],
  };
  await openSettings(page);
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(toast(page)).toContainText('Backup imported.');
  await expect(page.getByRole('button', { name: 'Edit Imported into Launch' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Imported into Brand new' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Edit Scroll the feed (overwritten)' }),
  ).toBeVisible();
  await expect(page.locator('[data-task-id="i-1"] .project-tag')).toHaveText('Launch');
  await expect(page.locator('[data-task-id="i-2"] .project-tag')).toHaveText('Brand new');
  const stored = await storedMatrix(page);
  expect(stored.tasks).toHaveLength(10);
  expect(stored.projects.map((p: { name: string }) => p.name)).toEqual([
    'Launch',
    'Home',
    'Brand new',
  ]);
  // Undo reverts the import.
  await toast(page).getByRole('button', { name: 'Undo' }).click();
  expect((await storedMatrix(page)).tasks).toHaveLength(8);
});

test('Import accepts a legacy v1 backup', async ({ page }) => {
  await open(page, { matrix: { tasks: [], projects: [] } });
  await openSettings(page);
  await page.locator('input[type=file]').setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ version: 1, tasks: [task({ id: 'v1', title: 'Legacy task', q: 'do' })] }),
    ),
  });
  await expect(toast(page)).toContainText('Backup imported.');
  await expect(page.locator('.task-title')).toHaveText(['Legacy task']);
});

for (const [name, content] of [
  ['not json at all', 'this is not json'],
  ['unknown version', JSON.stringify({ version: 9, tasks: [] })],
  [
    'task missing a title',
    JSON.stringify({ version: 2, projects: [], tasks: [task({ id: 'x', q: 'do' })] }),
  ],
  [
    'task pointing at an unknown project',
    JSON.stringify({
      version: 2,
      projects: [],
      tasks: [task({ id: 'x', title: 'T', q: 'do', projectId: 'nope' })],
    }),
  ],
] as const) {
  test(`Import rejects an invalid file: ${name}`, async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    await openSettings(page);
    await page.locator('input[type=file]').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from(content),
    });
    await expect(toast(page)).toHaveText(
      new RegExp(IMPORT_ERROR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    await expect(toast(page).getByRole('button', { name: 'Undo' })).toHaveCount(0);
    expect((await storedMatrix(page)).tasks).toHaveLength(8);
    await expect(page.locator('.task')).toHaveCount(7);
  });
}

test('the same file can be imported twice in a row (input is reset)', async ({ page }) => {
  await open(page, { matrix: { tasks: [], projects: [] } });
  const file = {
    name: 'again.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ version: 1, tasks: [task({ id: 'v1', title: 'Once', q: 'do' })] }),
    ),
  };
  await openSettings(page);
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.locator('.task')).toHaveCount(1);
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await openSettings(page);
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Edit Once' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.task')).toHaveCount(0);
  await openSettings(page);
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.locator('.task')).toHaveCount(1);
});
