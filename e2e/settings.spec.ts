/* Settings menu: dark mode, text size, labels, tutorial, reset board + Undo. */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  open,
  setup,
  seedMatrix,
  quadrant,
  storedMatrix,
  toast,
  openSettings,
  chooseAppearance,
} from './helpers';

test('dark appearance persists across reload', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await expect(page.locator('body')).not.toHaveClass(/night/);
  await chooseAppearance(page, 'Dark');
  await expect(page.locator('body')).toHaveClass(/night/);
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
  expect(await page.evaluate(() => localStorage.getItem('clearspace.theme'))).toBe('night');
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/night/);
  await openSettings(page);
  await expect(page.getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/night/);
  expect(await page.evaluate(() => localStorage.getItem('clearspace.theme'))).toBe('light');
});

test('text size control: step, clamp, reset and persist', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await openSettings(page);
  const scale = () =>
    page.evaluate(() => document.documentElement.style.getPropertyValue('--text-scale'));
  const dec = page.getByRole('button', { name: 'Decrease text size' });
  const inc = page.getByRole('button', { name: 'Increase text size' });
  const reset = page.getByRole('button', { name: 'Reset text size' });
  await expect(reset).toHaveText('100%');
  await inc.click();
  await inc.click();
  await expect(reset).toHaveText('120%');
  expect(await scale()).toBe('1.2');
  await dec.click();
  await dec.click();
  await dec.click();
  await expect(reset).toHaveText('90%');
  await expect(dec).toBeDisabled();
  expect(await scale()).toBe('0.9');
  expect(await page.evaluate(() => localStorage.getItem('clearspace.fontSize.v1'))).toBe('90');
  await page.reload();
  await openSettings(page);
  await expect(page.getByRole('button', { name: 'Reset text size' })).toHaveText('90%');
  await page.getByRole('button', { name: 'Reset text size' }).click();
  await expect(page.getByRole('button', { name: 'Reset text size' })).toHaveText('100%');
  for (let i = 0; i < 6; i++)
    await page.getByRole('button', { name: 'Increase text size' }).click();
  await expect(page.getByRole('button', { name: 'Reset text size' })).toHaveText('160%');
  await expect(page.getByRole('button', { name: 'Increase text size' })).toBeDisabled();
});

test('settings menu closes with Escape and shows storage information once', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await openSettings(page);
  await expect(page.locator('.settings-backup')).toContainText('Stored in this browser.');
  await expect(page.getByText('Saved on this browser', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeHidden();
});

test.describe('labels dialog', () => {
  // Phones hide the quadrant pencils to save room, so they edit labels from Settings.
  async function editLabels(page: Page, isMobile: boolean, quadrantTitle: string) {
    if (isMobile) {
      await openSettings(page);
      await page.getByRole('button', { name: 'Edit labels' }).click();
    } else {
      await page.getByRole('button', { name: `Edit ${quadrantTitle} title and subtitle` }).click();
    }
  }

  test('rename a quadrant, choose an icon, persist, and reset to defaults', async ({
    page,
    isMobile,
  }) => {
    await open(page, { matrix: seedMatrix });
    await openSettings(page);
    await page.getByRole('button', { name: 'Edit labels' }).click();
    const dialog = page.getByRole('dialog', { name: 'Make this matrix yours.' });
    await expect(dialog).toBeVisible();
    const titles = dialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titles).toHaveCount(4);
    await titles.nth(0).fill('Right now');
    await dialog
      .getByRole('textbox', { name: 'Subtitle', exact: true })
      .nth(0)
      .fill('Fire drills only');
    await dialog.getByRole('button', { name: 'Choose icon' }).first().click();
    await dialog.getByRole('button', { name: 'Target' }).click();
    await expect(dialog.getByRole('button', { name: 'Choose icon' }).first()).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await dialog.getByRole('button', { name: 'Save labels' }).click();
    await expect(toast(page)).toContainText('Labels updated.');
    await expect(dialog).toBeHidden();
    const q = quadrant(page, 'Right now');
    await expect(q.locator('p').first()).toHaveText('Fire drills only');
    await expect(page.getByRole('button', { name: 'Add a task to Right now' })).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('clearspace.labels.v1')!),
    );
    expect(stored.quadrants.do.title).toBe('Right now');
    await page.reload();
    await expect(quadrant(page, 'Right now')).toBeVisible();

    // The pencil on a quadrant opens the same dialog; defaults restore the originals.
    await editLabels(page, !!isMobile, 'Right now');
    await dialog.getByRole('button', { name: 'Use defaults' }).click();
    await dialog.getByRole('button', { name: 'Save labels' }).click();
    await expect(quadrant(page, 'Do first')).toBeVisible();
  });

  test('empty title is blocked by the form', async ({ page, isMobile }) => {
    await open(page, { matrix: seedMatrix });
    await editLabels(page, !!isMobile, 'Schedule');
    const dialog = page.getByRole('dialog', { name: 'Make this matrix yours.' });
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).nth(1).fill('');
    await dialog.getByRole('button', { name: 'Save labels' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(quadrant(page, 'Schedule')).toBeVisible();
  });
});

test.describe('tutorial', () => {
  test('opens from Settings > Help and steps through every screen', async ({ page }) => {
    await open(page, { matrix: seedMatrix });
    await openSettings(page);
    await page.getByRole('button', { name: 'Help' }).click();
    const dialog = page.locator('#helpDialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName('Getting Started');
    const progress = dialog.getByRole('progressbar', { name: 'Tutorial progress' });
    const total = Number(await progress.getAttribute('aria-valuemax'));
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    const skipBox = (await dialog.getByRole('button', { name: 'Skip tutorial' }).boundingBox())!;
    const contentBox = (await dialog.locator('#tutorialContent').boundingBox())!;
    expect(skipBox.y + skipBox.height).toBeLessThanOrEqual(contentBox.y);
    await expect(dialog.locator('.tutorial-actions button')).toHaveText(['Back', 'Next']);
    expect(total).toBe(7);
    await expect(dialog.locator('#tutorialTitle')).toHaveText('Decide what deserves your time.');
    await expect(dialog.getByRole('button', { name: 'Back' })).toBeDisabled();
    const seen: string[] = [];
    for (let i = 1; i < total; i++) {
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(progress).toHaveAttribute('aria-valuenow', String(i + 1));
      await expect(progress).toHaveAttribute('aria-valuetext', `Step ${i + 1} of ${total}`);
      seen.push((await dialog.locator('#tutorialTitle').textContent())!);
    }
    expect(seen.slice(0, 4)).toEqual(['Do first', 'Schedule', 'Delegate', 'Let go']);
    await expect(dialog.getByRole('button', { name: 'Use my own tasks' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Start with example tasks' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Back' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', String(total - 1));
    for (let i = total - 1; i > 3; i--) {
      await dialog.getByRole('button', { name: 'Back' }).click();
    }
    await expect(dialog.locator('#tutorialTitle')).toHaveText('Schedule');
    await expect(progress).toHaveAttribute('aria-valuenow', '3');
    await dialog.getByRole('button', { name: 'Skip tutorial' }).click();
    await expect(dialog).toBeHidden();
    expect((await storedMatrix(page)).tasks).toHaveLength(8);
  });

  test('first run opens it automatically; examples button seeds four tasks', async ({ page }) => {
    await open(page, { matrix: { tasks: [], projects: [] }, tutorialSeen: false });
    const dialog = page.locator('#helpDialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    for (let i = 1; i < 7; i++) {
      await dialog.getByRole('button', { name: 'Next' }).click();
    }
    await dialog.getByRole('button', { name: 'Start with example tasks' }).click();
    await expect(dialog).toBeHidden();
    await expect(toast(page)).toContainText('Example tasks added.');
    await expect(page.locator('.task')).toHaveCount(4);
    expect(await page.evaluate(() => localStorage.getItem('clearspace.tutorial.v1'))).toBe('seen');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Make room for what matters.' })).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('skipping on first run marks it seen', async ({ page }) => {
    await open(page, { matrix: { tasks: [], projects: [] }, tutorialSeen: false });
    const dialog = page.locator('#helpDialog');
    await dialog.getByRole('button', { name: 'Skip tutorial' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('clearspace.tutorial.v1'))).toBe('seen');
    await expect(page.locator('.task')).toHaveCount(0);
  });
});

test('reset board clears tasks and projects, then Undo from the toast restores them', async ({
  page,
}) => {
  await open(page, { matrix: seedMatrix });
  await openSettings(page);
  await page.getByRole('button', { name: 'Need a fresh start?' }).click();
  const dialog = page.getByRole('dialog', { name: 'Need a fresh start?' });
  await expect(dialog).toContainText(
    'All tasks and projects will be cleared. Your labels and appearance preferences will stay. You can undo this reset.',
  );
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  expect((await storedMatrix(page)).tasks).toHaveLength(8);

  await openSettings(page);
  await page.getByRole('button', { name: 'Need a fresh start?' }).click();
  await expect(dialog.getByRole('button', { name: 'Reset board' })).toBeDisabled();
  await dialog.getByLabel('Type Reset to confirm').fill('Reset');
  await dialog.getByRole('button', { name: 'Reset board' }).click();
  await expect(toast(page)).toContainText('Board reset. All tasks and projects cleared.');
  await expect(page.locator('.task')).toHaveCount(0);
  await expect(page.locator('.task-fab, .add-floating')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add your first task' })).toBeVisible();
  await expect(page.getByText('Start with what needs your attention.')).toBeVisible();
  expect(await storedMatrix(page)).toMatchObject({ tasks: [], projects: [] });

  await toast(page).getByRole('button', { name: 'Undo' }).click();
  await expect(toast(page)).toContainText('Undone.');
  await expect(page.locator('.task')).toHaveCount(7);
  await expect(page.locator('.task-fab')).toHaveCount(4);
  await expect(page.locator('.add-floating')).toHaveCount(1);
  const stored = await storedMatrix(page);
  expect(stored.tasks).toHaveLength(8);
  expect(stored.projects).toHaveLength(2);
});

test('toast auto-dismisses and can be dismissed manually', async ({ page }) => {
  await setup(page, { matrix: seedMatrix });
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  await page.goto('/');
  await openSettings(page);
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await expect(toast(page)).toContainText('Completed tasks cleared.');
  await page.clock.runFor(10_500);
  await expect(toast(page)).toHaveCount(0);
  await openSettings(page);
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await toast(page).getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(toast(page)).toHaveCount(0);
});

test('Reset board confirm stays readable on hover', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'Hover needs a pointer');
  await open(page, { matrix: seedMatrix });
  await openSettings(page);
  await page.getByRole('button', { name: 'Need a fresh start?' }).click();
  const confirm = page.getByRole('dialog').getByRole('button', { name: 'Reset board' });
  await page.getByLabel('Type Reset to confirm').fill('Reset');
  await confirm.hover();
  await expect(confirm).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(confirm).toHaveCSS('background-color', 'rgb(143, 44, 37)');
});
