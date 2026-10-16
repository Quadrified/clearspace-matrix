/* UX pass: one-click add, tab counts, filter summary, first-task prompt, date chips, backup state. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, editorDialog, storedMatrix, openFilters } from './helpers';

test('quadrant add opens the editor and Projects remains available in the toolbar', async ({
  page,
}) => {
  await open(page, { matrix: seedMatrix });
  await page.getByRole('button', { name: 'Add a task to Do first', exact: true }).click();
  await expect(page.locator('#newTask')).toHaveCount(0);
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
  await expect(active.locator('.tab-indicator')).toHaveCSS(
    'background-image',
    'linear-gradient(rgb(47, 132, 86), rgb(31, 98, 64))',
  );
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
  await page.getByRole('textbox', { name: 'Find a task' }).fill('health');
  await expect(page.locator('.filter-summary')).toContainText('2 tasks match');
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.locator('.filter-summary')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Find a task' })).toHaveValue('');
});

test('an empty board offers a first task and examples, and hides the zero stats', async ({
  page,
}) => {
  await open(page, { matrix: { tasks: [], projects: [] } });
  await expect(page.getByRole('region', { name: 'Task overview' })).toHaveCount(0);
  await expect(page.locator('.task-fab, .add-floating')).toHaveCount(0);
  await page.getByRole('button', { name: 'Try example tasks' }).click();
  await expect(page.locator('.task')).toHaveCount(4);
  await expect(page.locator('.task-fab')).toHaveCount(4);
  await expect(page.locator('.add-floating')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Task overview' })).toBeVisible();
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`empty-board add controls stay hidden through cancel and reveal after save (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page, { matrix: { tasks: [], projects: [] } });
    await expect(page.locator('.task-fab, .add-floating')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add your first task' }).click();
    await editorDialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(editorDialog(page)).toHaveCount(0);
    await expect(page.locator('.task-fab, .add-floating')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add your first task' }).click();
    await editorDialog(page).getByPlaceholder('What do you need to do?').fill('My first task');
    await editorDialog(page).getByRole('button', { name: 'Save task' }).click();
    await expect(page.locator('.task-fab')).toHaveCount(4);
    await expect(page.locator('.task-fab').first()).toHaveCSS(
      'animation-name',
      reducedMotion === 'reduce' ? 'none' : 'task-in',
    );
    await expect(page.locator('.first-task')).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Find a task' }).fill('no matches');
    await expect(page.locator('.task')).toHaveCount(0);
    await expect(page.locator('.task-fab')).toHaveCount(4);
    await expect(page.locator('.add-floating')).toHaveCount(1);
  });
}

test('date chips fill the due date', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await page.getByRole('button', { name: 'Add a task to Do first', exact: true }).click();
  const dialog = editorDialog(page);
  await dialog.getByRole('button', { name: 'Tomorrow' }).click();
  await expect(dialog.getByLabel('Due date')).toHaveValue('10/16/2026');
  await dialog.getByRole('button', { name: 'Next week' }).click();
  await expect(dialog.getByLabel('Due date')).toHaveValue('10/22/2026');
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

test('phones get a floating add button and a bottom-sheet filter panel', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Phone layout only');
  await open(page, { matrix: seedMatrix });
  await openFilters(page);
  const panel = await page.locator('#filtersPanel').boundingBox();
  const viewport = page.viewportSize()!;
  expect(panel!.y + panel!.height).toBeGreaterThan(viewport.height - 2);
  expect(panel!.width).toBeGreaterThan(viewport.width - 2);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Quick add task' }).click();
  await expect(editorDialog(page)).toBeVisible();
});

for (const width of [390, 900, 1280, 1440]) {
  for (const theme of ['light', 'night'] as const) {
    for (const size of [90, 125, 160]) {
      for (const populated of [false, true]) {
        test(`day panel at ${width}px, ${theme}, ${size}%, ${populated ? 'populated' : 'empty'}`, async ({
          page,
          isMobile,
        }) => {
          test.skip(Boolean(isMobile) !== width <= 760, 'Use the matching device project');
          await page.setViewportSize({ width, height: 900 });
          await open(page, {
            matrix: populated ? seedMatrix : { tasks: [], projects: [] },
            theme,
            size,
          });
          const day = page.locator('.day');
          const overview = page.getByRole('region', { name: 'Task overview' });
          const art = day.locator('.axis-board');
          const dayBox = (await day.boundingBox())!;
          const dateBox = (await day.locator('.date').boundingBox())!;
          const artBox = (await art.boundingBox())!;
          const board = (await page.locator('.board-column').boundingBox())!;
          await expect(overview).toHaveCount(populated ? 1 : 0);
          await expect(art).toHaveAttribute('aria-hidden', 'true');
          expect(artBox.x + artBox.width).toBeLessThanOrEqual(dayBox.x + dayBox.width + 1);

          if (width >= 1360) {
            // A side rail: the day sits beside the board and the board starts at the top.
            expect(dayBox.x + dayBox.width).toBeLessThanOrEqual(board.x);
            expect(Math.abs(board.y - dayBox.y)).toBeLessThan(1);
            expect(artBox.y).toBeGreaterThan(dateBox.y + dateBox.height);
            await expect(page.locator('#matrixSubtitle')).toBeVisible();
          } else {
            // A single line above the board, with a small illustration beside the date.
            expect(board.y).toBeGreaterThanOrEqual(dayBox.y + dayBox.height);
            expect(artBox.x).toBeGreaterThanOrEqual(dateBox.x + dateBox.width);
            expect(
              Math.abs(artBox.y + artBox.height / 2 - dateBox.y - dateBox.height / 2),
            ).toBeLessThan(4);
            expect(artBox.width).toBeLessThanOrEqual(56 * (size / 100) + 1);
            await expect(page.locator('#matrixSubtitle')).toBeHidden();
          }

          if (populated) {
            const box = (await overview.boundingBox())!;
            expect(box.x + box.width).toBeLessThanOrEqual(dayBox.x + dayBox.width + 1);
          } else {
            const prompt = (await page.locator('.first-task').boundingBox())!;
            expect(prompt.x).toBeGreaterThanOrEqual(board.x);
          }
          if (width <= 1200 && size <= 100) {
            // The quadrants are on the first screen, not pushed below a hero.
            const matrix = (await page.locator('.matrix').boundingBox())!;
            expect(matrix.y).toBeLessThan(populated ? 420 : 600);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);
        });
      }
    }
  }
}
