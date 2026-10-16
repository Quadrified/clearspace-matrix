/* Search, category / project / sort Selects and the Active / Completed / All tabs. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, quadrant, titles, pickFilter, openFilters } from './helpers';

test.beforeEach(async ({ page }) => {
  await open(page, { matrix: seedMatrix });
});

test('search filters by title, notes, owner, category and project name', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Find a task' });
  await search.fill('proposal');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal']);
  await expect(page.locator('.count')).toHaveText(['1', '0', '0', '0']);
  await expect(page.getByText('No matching tasks.')).toHaveCount(3);
  await search.fill('chapter');
  await expect(page.locator('.task-title')).toHaveText(['Read book']);
  await search.fill('sam');
  await expect(page.locator('.task-title')).toHaveText(['Format meeting notes']);
  await search.fill('health');
  await expect(page.locator('.task-title')).toHaveText(['Plan workout', 'Call dentist']);
  await search.fill('LAUNCH');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal']);
});

test('clear search button resets and refocuses the field', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Find a task' });
  await expect(page.getByRole('button', { name: 'Clear search' })).toHaveCount(0);
  await search.fill('zzz-nothing');
  await expect(page.locator('.task')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(page.locator('.task')).toHaveCount(7);
});

test('category chips filter and toggle off', async ({ page }) => {
  await pickFilter(page, 'Category', 'Health');
  await expect(page.locator('.task-title')).toHaveText(['Plan workout', 'Call dentist']);
  await pickFilter(page, 'Category', 'Work');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal', 'Format meeting notes']);
  await expect(page.locator('#filtersButton .filters-badge')).toHaveText('1');
  await pickFilter(page, 'Category', 'Work');
  await expect(page.locator('.task')).toHaveCount(7);
  await expect(page.locator('#filtersButton .filters-badge')).toHaveCount(0);
});

test('project chips including No project', async ({ page }) => {
  await pickFilter(page, 'Project', 'Launch');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal']);
  await pickFilter(page, 'Project', 'Home');
  await expect(page.locator('.task-title')).toHaveText(['Read book']);
  await pickFilter(page, 'Project', 'No project');
  await expect(page.locator('.task-title')).toHaveText([
    'Pay invoice',
    'Plan workout',
    'Call dentist',
    'Format meeting notes',
    'Scroll the feed',
  ]);
  await pickFilter(page, 'Project', 'No project');
  await expect(page.locator('.task')).toHaveCount(7);
});

test('sort: your order, due date, newest', async ({ page }) => {
  const schedule = quadrant(page, 'Schedule');
  await openFilters(page);
  await expect(
    page.locator('#filtersPanel').getByRole('button', { name: 'Your order', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(await titles(schedule)).toEqual(['Plan workout', 'Call dentist', 'Read book']);
  await pickFilter(page, 'Sort tasks', 'Due date');
  expect(await titles(schedule)).toEqual(['Read book', 'Plan workout', 'Call dentist']);
  await pickFilter(page, 'Sort tasks', 'Newest');
  expect(await titles(schedule)).toEqual(['Call dentist', 'Read book', 'Plan workout']);
  await pickFilter(page, 'Sort tasks', 'Your order');
  expect(await titles(schedule)).toEqual(['Plan workout', 'Call dentist', 'Read book']);
});

test('applied filters show as removable chips and Clear all resets everything', async ({
  page,
}) => {
  await pickFilter(page, 'Category', 'Work');
  await pickFilter(page, 'Project', 'Launch');
  await pickFilter(page, 'Sort tasks', 'Due date');
  await page.keyboard.press('Escape');
  await expect(page.locator('#filtersPanel')).toBeHidden();
  const summary = page.locator('.filter-summary');
  await expect(summary).toContainText('1 task matches');
  await expect(summary.locator('.applied-chip')).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove Project filter: Launch' }).click();
  await expect(summary.locator('.applied-chip')).toHaveCount(2);
  await summary.getByRole('button', { name: 'Clear all' }).click();
  await expect(summary).toHaveCount(0);
  await expect(page.locator('.task')).toHaveCount(7);
});

test('status tabs: Active, Completed, All tasks', async ({ page }) => {
  const doFirst = quadrant(page, 'Do first');
  const active = page.getByRole('button', { name: 'Active', exact: true });
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  expect(await titles(doFirst)).toEqual(['Send proposal', 'Pay invoice']);

  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Completed', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await titles(doFirst)).toEqual(['Finish slides']);
  await expect(page.getByText('Nothing completed here yet.')).toHaveCount(3);
  await expect(doFirst.locator('.task.done')).toHaveCount(1);

  await page.getByRole('button', { name: 'All tasks' }).click();
  expect(await titles(doFirst)).toEqual(['Send proposal', 'Pay invoice', 'Finish slides']);
  await expect(page.locator('.count')).toHaveText(['3', '3', '1', '1']);

  await active.click();
  expect(await titles(doFirst)).toEqual(['Send proposal', 'Pay invoice']);
});

test('combined filters narrow results and show the empty message', async ({ page }) => {
  await pickFilter(page, 'Category', 'Work');
  await page.getByRole('textbox', { name: 'Find a task' }).fill('sam');
  await expect(page.locator('.task-title')).toHaveText(['Format meeting notes']);
  await pickFilter(page, 'Project', 'Home');
  await expect(page.locator('.task')).toHaveCount(0);
  await expect(page.getByText('No matching tasks.')).toHaveCount(4);
});
