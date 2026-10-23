/*
 * Clearspace end-to-end regression suite (real Chromium against the production build).
 *
 * README
 *   Run everything:        npm run test:e2e         (builds, serves on :8000, reuses a running server)
 *   One project:           npx playwright test --project=desktop
 *   One file:              npx playwright test e2e/tasks.spec.ts
 *   Screenshot baselines:  SHOTS_DIR=/some/dir npx playwright test e2e/screenshots.spec.ts --project=desktop
 *   Compare two runs:      cmp every PNG in the two directories (they should be byte-identical).
 *   Notes: tests seed localStorage through e2e/helpers.ts (fixed clock 2026-10-15T12:00:00Z, UTC,
 *   reduced motion). They assert CURRENT behaviour, so a failure after a refactor means a visible
 *   change. If the server is already running on :8000, rebuild first (npm run build) or it will
 *   serve a stale dist.
 *
 * This file: add / edit / complete / reopen / delete tasks and drag between quadrants.
 */
import { test, expect } from '@playwright/test';
import {
  openSettings,
  open,
  seedMatrix,
  quadrant,
  titles,
  toast,
  storedMatrix,
  choose,
  editorDialog,
  pickFilter,
} from './helpers';

test.describe('adding tasks', () => {
  test('the starter card creates a first task in the Do first quadrant', async ({ page }) => {
    await open(page, { matrix: { tasks: [], projects: [] } });
    await expect(page.getByText('Start with what needs your attention.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add your first task' })).toBeVisible();
    await page.getByRole('button', { name: 'Add your first task', exact: true }).click();
    const dialog = editorDialog(page);
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('What do you need to do?').fill('Write the report');
    await dialog.getByPlaceholder(/A first step/).fill('Start with an outline');
    await dialog.getByRole('button', { name: 'Save task' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.task-fab')).toHaveCount(4);
    await expect(page.locator('.add-floating')).toHaveCount(1);
    await expect(page.locator('.first-task')).toHaveCount(0);
    await expect(toast(page)).toContainText('Task added.');
    const doFirst = quadrant(page, 'Do first');
    await expect(doFirst.locator('.task-title')).toHaveText(['Write the report']);
    await expect(doFirst.locator('.task-notes')).toHaveText('Start with an outline');
    await expect(doFirst.locator('.tag')).toHaveText(['Work']);
    const stored = await storedMatrix(page);
    expect(stored.version).toBe(2);
    expect(stored.tasks).toHaveLength(1);
    expect(stored.tasks[0]).toMatchObject({
      title: 'Write the report',
      q: 'do',
      category: 'Work',
      done: false,
    });
  });

  test('N shortcut opens the editor; typing N inside inputs does not', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Keyboard shortcut is a desktop affordance');
    await open(page, { matrix: { tasks: [], projects: [] } });
    await page.keyboard.press('n');
    const dialog = editorDialog(page);
    await expect(dialog).toBeVisible();
    // Observed (not asserted): which element has focus right after the dialog opens. At the time
    // of writing this is the dialog's Close button rather than the title field.
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
    );
    test.info().annotations.push({ type: 'initial-focus', description: String(focused) });
    // Typing "n" and "p" inside the title field must not retrigger the shortcuts.
    const title = dialog.getByPlaceholder('What do you need to do?');
    await title.click();
    await page.keyboard.type('Nonstop plan');
    await expect(title).toHaveValue('Nonstop plan');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(quadrant(page, 'Do first').locator('.task-title')).toHaveText(['Nonstop plan']);
    // P opens the projects dialog.
    await page.keyboard.press('p');
    await expect(page.getByRole('dialog', { name: 'A place for your projects.' })).toBeVisible();
  });

  test('quadrant plus button adds to that quadrant and choosing a quadrant in the editor works', async ({
    page,
  }) => {
    await open(page, { matrix: { ...seedMatrix, tasks: seedMatrix.tasks.slice(0, 1) } });
    await page.getByRole('button', { name: 'Add a task to Schedule' }).click();
    const dialog = editorDialog(page);
    await expect(dialog.getByRole('radio', { name: 'Schedule' })).toBeChecked();
    await dialog.getByPlaceholder('What do you need to do?').fill('Plan the trip');
    await dialog.getByRole('radio', { name: 'Let go' }).check();
    await choose(page, 'Category', 'Personal', dialog);
    await dialog.getByLabel('Due date').fill('10/30/2026');
    await dialog.getByRole('button', { name: 'Save task' }).click();
    const q = quadrant(page, 'Let go');
    await expect(q.locator('.task-title')).toHaveText(['Plan the trip']);
    await expect(q.locator('.tag')).toHaveText(['Personal']);
    await expect(q.locator('.duedate')).toHaveText('Oct 30');
  });

  test('Save needs a two-character title, and Cancel discards', async ({ page }) => {
    await open(page, { matrix: { tasks: [], projects: [] } });
    await page.getByRole('button', { name: 'Add your first task' }).click();
    const dialog = editorDialog(page);
    const title = dialog.getByPlaceholder('What do you need to do?');
    const save = dialog.getByRole('button', { name: 'Save task' });
    await expect(save).toBeDisabled();
    await title.fill('a');
    await title.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(save).toBeDisabled();
    await title.fill('Will be discarded');
    await expect(save).toBeEnabled();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.task')).toHaveCount(0);
    expect((await storedMatrix(page)).tasks).toHaveLength(0);
  });
});

test.describe('existing tasks', () => {
  test('edit a task', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    await page.getByRole('button', { name: 'Edit Pay invoice' }).click();
    const dialog = editorDialog(page);
    const title = dialog.getByPlaceholder('What do you need to do?');
    await expect(title).toHaveValue('Pay invoice');
    await expect(dialog.getByRole('button', { name: 'Delete' })).toBeVisible();
    await title.fill('Pay the electricity invoice');
    await dialog.getByRole('radio', { name: 'Delegate' }).check();
    await dialog.getByRole('button', { name: 'Save task' }).click();
    await expect(toast(page)).toContainText('Task updated.');
    await expect(titles(quadrant(page, 'Do first'))).resolves.toEqual(['Send proposal']);
    await expect(titles(quadrant(page, 'Delegate'))).resolves.toEqual([
      'Pay the electricity invoice',
      'Format meeting notes',
    ]);
    const stored = await storedMatrix(page);
    expect(stored.tasks.find((t: { id: string }) => t.id === 't-invoice')).toMatchObject({
      title: 'Pay the electricity invoice',
      q: 'delegate',
    });
  });

  test('overdue and today due dates render as labels', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    const doFirst = quadrant(page, 'Do first');
    await expect(doFirst.locator('.duedate')).toHaveText(['Today', 'Overdue · Oct 10']);
  });

  test('complete, then reopen, moving completed tasks to the bottom', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    const doFirst = quadrant(page, 'Do first');
    await expect(doFirst.locator('.task-title')).toHaveText(['Send proposal', 'Pay invoice']);
    const progress = page.getByRole('progressbar', { name: 'Completion' });
    await expect(progress).toHaveAttribute('aria-valuetext', '1 of 8 tasks completed');

    await page.getByRole('checkbox', { name: 'Complete Send proposal' }).click();
    await expect(toast(page)).toContainText('Task updated.');
    // Active tab hides it...
    await expect(doFirst.locator('.task-title')).toHaveText(['Pay invoice']);
    await expect(progress).toHaveAttribute('aria-valuetext', '2 of 8 tasks completed');
    // ...and the All tab lists it after the active one, with completed tasks last.
    await page.getByRole('button', { name: 'All tasks' }).click();
    await expect(doFirst.locator('.task-title')).toHaveText([
      'Pay invoice',
      'Finish slides',
      'Send proposal',
    ]);
    await expect(doFirst.locator('.task.done')).toHaveCount(2);

    await page.getByRole('checkbox', { name: 'Reopen Finish slides' }).uncheck();
    await expect(doFirst.locator('.task.done')).toHaveCount(1);
    await expect(doFirst.locator('.task-title')).toHaveText([
      'Pay invoice',
      'Finish slides',
      'Send proposal',
    ]);
    const stored = await storedMatrix(page);
    const byId = Object.fromEntries(
      stored.tasks.map((t: { id: string; done: boolean }) => [t.id, t]),
    );
    expect(byId['t-proposal'].done).toBe(true);
    expect(typeof byId['t-proposal'].completedAt).toBe('number');
    expect(byId['t-slides'].done).toBe(false);
    expect(byId['t-slides'].completedAt).toBeNull();
  });

  test('completing the last active task in a quadrant keeps the board consistent', async ({
    page,
  }) => {
    await open(page, { matrix: seedMatrix });
    await page.getByRole('checkbox', { name: 'Complete Scroll the feed' }).click();
    await expect(page.getByText('All clear here.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Completed/ }).locator('.tab-count')).toHaveText(
      '2',
    );
  });

  test('delete a task from the editor and undo', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    await page.getByRole('button', { name: 'Edit Scroll the feed' }).click();
    await editorDialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(toast(page)).toContainText('Task deleted.');
    await expect(page.getByRole('button', { name: 'Edit Scroll the feed' })).toHaveCount(0);
    expect((await storedMatrix(page)).tasks).toHaveLength(7);
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(toast(page)).toContainText('Undone.');
    await expect(page.getByRole('button', { name: 'Edit Scroll the feed' })).toBeVisible();
    expect((await storedMatrix(page)).tasks).toHaveLength(8);
  });

  test('Clear completed removes only completed tasks', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    await openSettings(page);
    await page.getByRole('button', { name: 'Clear completed' }).click();
    await expect(toast(page)).toContainText('Completed tasks cleared.');
    expect((await storedMatrix(page)).tasks).toHaveLength(7);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'All tasks' }).click();
    await expect(page.locator('.task')).toHaveCount(7);
  });
});

test.describe('drag and drop', () => {
  test('drag a task to another quadrant', async ({ page, isMobile }) => {
    test.skip(isMobile, 'HTML5 drag and drop is desktop-only; phones use the editor');
    await open(page, { matrix: seedMatrix });
    const source = page.locator('[data-task-id="t-invoice"]');
    const target = quadrant(page, 'Schedule').locator('.qhead');
    await source.dragTo(target);
    await expect(toast(page)).toContainText('Task moved.');
    await expect(titles(quadrant(page, 'Do first'))).resolves.toEqual(['Send proposal']);
    await expect(titles(quadrant(page, 'Schedule'))).resolves.toEqual([
      'Plan workout',
      'Call dentist',
      'Read book',
      'Pay invoice',
    ]);
    const stored = await storedMatrix(page);
    expect(stored.tasks.find((t: { id: string }) => t.id === 't-invoice').q).toBe('schedule');
  });

  test('drop onto a specific task inserts before it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'HTML5 drag and drop is desktop-only');
    await open(page, { matrix: seedMatrix });
    await page
      .locator('[data-task-id="t-feed"]')
      .dragTo(page.locator('[data-task-id="t-workout"]'));
    await expect(titles(quadrant(page, 'Schedule'))).resolves.toEqual([
      'Scroll the feed',
      'Plan workout',
      'Call dentist',
      'Read book',
    ]);
  });

  test('tasks are not draggable when sorted by due date', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    await expect(page.locator('[data-task-id="t-invoice"]')).toHaveAttribute('draggable', 'true');
    await pickFilter(page, 'Sort tasks', 'Due date');
    await expect(page.locator('[data-task-id="t-invoice"]')).toHaveAttribute('draggable', 'false');
  });
});
