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
  await page.getByRole('button', { name: 'Try example tasks' }).click();
  await expect(page.locator('.task')).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Task overview' })).toBeVisible();
});

test('date chips fill the due date', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
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

for (const width of [390, 900, 1440]) {
  for (const theme of ['light', 'night'] as const) {
    for (const size of [90, 125, 160]) {
      for (const populated of [false, true]) {
        test(`hero layout at ${width}px, ${theme}, ${size}%, ${populated ? 'populated' : 'empty'}`, async ({
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
          const hero = page.locator('.intro');
          const copy = page.locator('.intro-copy');
          const overview = page.getByRole('region', { name: 'Task overview' });
          const art = page.locator('.axis-board');
          const heroBox = (await hero.boundingBox())!;
          const copyBox = (await copy.boundingBox())!;
          const dateBox = (await hero.locator('.date').boundingBox())!;
          await expect(overview).toHaveCount(populated ? 1 : 0);
          expect(copyBox.x).toBeGreaterThanOrEqual(heroBox.x);
          expect(copyBox.x + copyBox.width).toBeLessThanOrEqual(heroBox.x + heroBox.width + 1);

          if (width <= 760) {
            await expect(art).toBeHidden();
            await expect(page.locator('#matrixSubtitle')).toBeHidden();
          } else {
            const artBox = (await art.boundingBox())!;
            expect(artBox.x).toBeGreaterThanOrEqual(copyBox.x + copyBox.width);
            expect(artBox.x + artBox.width).toBeLessThanOrEqual(heroBox.x + heroBox.width + 1);
            expect(artBox.width).toBeLessThanOrEqual(360);
            expect(
              Math.abs(copyBox.y + copyBox.height / 2 - artBox.y - artBox.height / 2),
            ).toBeLessThan(1);
          }

          if (populated) {
            await expect(copy.locator('.overview')).toHaveCount(1);
            const progressBox = (await overview.boundingBox())!;
            const above =
              width <= 760 ? dateBox : (await page.locator('#matrixSubtitle').boundingBox())!;
            expect(progressBox.y - above.y - above.height).toBeCloseTo(width <= 760 ? 16 : 24, 0);
            expect(progressBox.width).toBeCloseTo(copyBox.width, 0);
            const completion = (await overview.locator('.overview-completion').boundingBox())!;
            const counts = await overview.locator('.overview-stat').all();
            for (const count of counts) {
              const box = (await count.boundingBox())!;
              expect(box.x + box.width).toBeLessThanOrEqual(progressBox.x + progressBox.width + 1);
              if (copyBox.width < 560) {
                expect(box.y).toBeGreaterThanOrEqual(completion.y + completion.height);
              } else {
                expect(box.x).toBeGreaterThanOrEqual(completion.x + completion.width);
              }
            }
            expect(await overview.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
          } else {
            await expect(hero.locator('.first-task')).toHaveCount(0);
            const prompt = (await page.locator('.first-task').boundingBox())!;
            expect(prompt.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height);
            expect(prompt.width).toBeCloseTo(heroBox.width, 0);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);
        });
      }
    }
  }
}
