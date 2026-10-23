/* UX pass: one-click add, tab counts, filter summary, first-task prompt, date chips, backup state. */
import { test, expect } from '@playwright/test';
import {
  open,
  seedMatrix,
  editorDialog,
  storedMatrix,
  openFilters,
  openSettings,
  chooseAppearance,
} from './helpers';

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

test('the status tabs are plain words with a soft highlight and one count', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  const active = page.locator('.tabs button.active');
  await expect(active).toContainText('Active');
  await expect(active.locator('.tab-count')).toBeVisible();
  await expect(active.locator('.tab-indicator')).toHaveCSS('background-image', 'none');
  await expect(page.getByRole('button', { name: /^Completed/ }).locator('.tab-count')).toBeHidden();
  await page.getByRole('button', { name: /^Completed/ }).click();
  await expect(page.locator('.tabs button.active')).toContainText('Completed');
  await expect(page.getByRole('button', { name: /^Active/ }).locator('.tab-count')).toBeHidden();
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
    // Role queries exclude the inert, aria-hidden dialog during its exit animation.
    // Wait for DOM removal so reopening starts with a fresh native dialog.
    await expect(page.locator('#taskDialog')).toHaveCount(0);
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

test('exporting a backup records it in Settings', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toHaveCount(0);
  await openSettings(page);
  await expect(page.locator('.backup-state')).toHaveText('Last backup: never.');
  await expect(page.locator('.backup-state')).toHaveClass(/due/);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
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

test('new visitors start in Light even when the system is dark', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', locale: 'en-US' });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('clearspace.tutorial.v1', 'seen'));
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveClass(/night/);
  await openSettings(page);
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await context.close();
});

test('Auto appearance switches live with the system and can be restored after a manual choice', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, { matrix: seedMatrix });
  await chooseAppearance(page, 'Auto');
  await expect(page.locator('body')).not.toHaveClass(/night/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('body')).toHaveClass(/night/);
  await chooseAppearance(page, 'Light');
  await expect(page.locator('body')).not.toHaveClass(/night/);
  await openSettings(page);
  const auto = page.getByRole('button', { name: 'Auto' });
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('body')).toHaveClass(/night/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).not.toHaveClass(/night/);
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/night/);
});

test('phones add from each quadrant and get a bottom-sheet filter panel', async ({
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
  // The board fits the screen, so each quadrant's own add button replaces the floating one.
  await expect(page.getByRole('button', { name: 'Quick add task' })).toBeHidden();
  await page.getByRole('button', { name: 'Add a task to Do first', exact: true }).click();
  await expect(editorDialog(page)).toBeVisible();
});

for (const width of [390, 900, 1280, 1440]) {
  for (const theme of ['light', 'night'] as const) {
    for (const size of [90, 125, 160]) {
      for (const populated of [false, true]) {
        test(`top bar at ${width}px, ${theme}, ${size}%, ${populated ? 'populated' : 'empty'}`, async ({
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
          const header = (await page.locator('header').boundingBox())!;
          const day = page.locator('header .day');
          const overview = page.getByRole('region', { name: 'Task overview' });
          const tabs = (await page.locator('header .tabs').boundingBox())!;
          const tools = (await page.locator('header .header-right').boundingBox())!;
          const matrix = (await page.locator('.matrix').boundingBox())!;

          // Date, progress (or the first-task prompt), tabs and tools all live in the top bar.
          await expect(overview).toHaveCount(populated ? 1 : 0);
          await expect(day.locator('.first-task')).toHaveCount(populated ? 0 : 1);
          for (const name of ['Filters', 'Projects', 'Settings'])
            await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
          expect(tabs.y + tabs.height).toBeLessThanOrEqual(header.y + header.height + 1);
          expect(tools.x + tools.width).toBeLessThanOrEqual(width);
          expect(matrix.y).toBeGreaterThanOrEqual(header.y + header.height);

          if (width > 760) {
            // One row: the tabs sit beside the tools rather than below them.
            expect(Math.abs(tabs.y + tabs.height / 2 - (tools.y + tools.height / 2))).toBeLessThan(
              4,
            );
            expect(tabs.x + tabs.width).toBeLessThanOrEqual(tools.x);
            if (size <= 100) expect(header.height).toBeLessThanOrEqual(64);
          } else {
            // Phones: the tabs take a second row under the date and tools.
            expect(tabs.y).toBeGreaterThanOrEqual(tools.y + tools.height - 1);
          }
          if (size <= 100) {
            // Little stands between the top of the screen and the quadrants.
            expect(matrix.y).toBeLessThan(width > 760 ? 120 : 140);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);
        });
      }
    }
  }
}

test('search is a single icon until it is focused or holds a query', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  const search = page.locator('header .search');
  const input = page.getByRole('textbox', { name: 'Find a task' });
  const closed = (await search.boundingBox())!.width;
  expect(closed).toBeLessThanOrEqual(40);
  await input.focus();
  await expect.poll(async () => (await search.boundingBox())!.width).toBeGreaterThan(closed + 60);
  await input.fill('health');
  await page.locator('.matrix').click({ position: { x: 4, y: 4 } });
  // A query keeps the field open after focus moves away.
  expect((await search.boundingBox())!.width).toBeGreaterThan(closed + 60);
  await input.press('Escape');
  await expect(input).toHaveValue('');
});

test('the theme switch and GitHub link live in Settings, not the top bar', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.getByRole('banner').getByRole('switch')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /github/i })).toHaveCount(0);
  await openSettings(page);
  await expect(page.getByRole('link', { name: /source on github/i })).toBeVisible();
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [844, 390],
  [900, 600],
  [1280, 720],
  [1440, 900],
]) {
  for (const size of [100, 160]) {
    test(`four equal quadrants stay within ${width}x${height} at ${size}% with overflowing tasks`, async ({
      page,
      isMobile,
    }) => {
      test.skip(Boolean(isMobile) !== width <= 760, 'Use the matching device project');
      await page.setViewportSize({ width, height });
      const base = seedMatrix.tasks[0]!;
      const tasks = ['do', 'schedule', 'delegate', 'eliminate'].flatMap((q) =>
        Array.from({ length: 15 }, (_, i) => ({
          ...base,
          q,
          id: `${q}-${i}`,
          title: `Task ${i + 1} with a long title`,
          subtasks: Array.from({ length: 5 }, (_, j) => ({
            id: `${q}-${i}-${j}`,
            title: `Step ${j + 1}`,
            done: false,
          })),
        })),
      );
      await open(page, { matrix: { ...seedMatrix, tasks }, size });
      const boxes = await page.locator('.quad').evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
      expect(boxes).toHaveLength(4);
      for (const box of boxes) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
        expect(box.height).toBeGreaterThan(0);
        expect(Math.abs(box.height - boxes[0]!.height)).toBeLessThan(1);
        expect(Math.abs(box.width - boxes[0]!.width)).toBeLessThan(1);
      }
      expect(boxes[1]!.x).toBeGreaterThan(boxes[0]!.x);
      expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y);
      expect(
        await page.evaluate(() => ({
          horizontal: document.documentElement.scrollWidth > innerWidth,
          vertical: document.documentElement.scrollHeight > innerHeight,
        })),
      ).toEqual({ horizontal: false, vertical: false });
      const list = page.locator('.tasklist').first();
      expect(await list.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
      await list.focus();
      await page.keyboard.press('End');
      await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
      await page.getByRole('button', { name: 'Completed', exact: true }).click();
      const after = await page.locator('.quad').first().boundingBox();
      expect(after!.height).toBeCloseTo(boxes[0]!.height, 0);
      expect(after!.width).toBeCloseTo(boxes[0]!.width, 0);
    });
  }
}
