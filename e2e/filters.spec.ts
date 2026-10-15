/* Search, category / project / sort Selects and the Active / Completed / All tabs. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, quadrant, titles, choose, openFilters } from './helpers';

test.beforeEach(async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await openFilters(page);
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

test('category select', async ({ page }) => {
  await choose(page, 'Filter by category', 'Health');
  await expect(page.locator('.task-title')).toHaveText(['Plan workout', 'Call dentist']);
  await choose(page, 'Filter by category', 'Work');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal', 'Format meeting notes']);
  await choose(page, 'Filter by category', 'All categories');
  await expect(page.locator('.task')).toHaveCount(7);
});

test('project select including No project', async ({ page }) => {
  await choose(page, 'Filter by project', 'Launch');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal']);
  await choose(page, 'Filter by project', 'Home');
  await expect(page.locator('.task-title')).toHaveText(['Read book']);
  await choose(page, 'Filter by project', 'No project');
  await expect(page.locator('.task-title')).toHaveText([
    'Pay invoice',
    'Plan workout',
    'Call dentist',
    'Format meeting notes',
    'Scroll the feed',
  ]);
  await choose(page, 'Filter by project', 'All projects');
  await expect(page.locator('.task')).toHaveCount(7);
});

test('sort select: your order, due date, newest first', async ({ page }) => {
  const schedule = quadrant(page, 'Schedule');
  await expect(page.getByRole('combobox', { name: 'Sort tasks' })).toContainText('Your order');
  expect(await titles(schedule)).toEqual(['Plan workout', 'Call dentist', 'Read book']);
  await choose(page, 'Sort tasks', 'Due date');
  expect(await titles(schedule)).toEqual(['Read book', 'Plan workout', 'Call dentist']);
  await choose(page, 'Sort tasks', 'Newest first');
  expect(await titles(schedule)).toEqual(['Call dentist', 'Read book', 'Plan workout']);
  await choose(page, 'Sort tasks', 'Your order');
  expect(await titles(schedule)).toEqual(['Plan workout', 'Call dentist', 'Read book']);
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
  await choose(page, 'Filter by category', 'Work');
  await page.getByRole('textbox', { name: 'Find a task' }).fill('sam');
  await expect(page.locator('.task-title')).toHaveText(['Format meeting notes']);
  await choose(page, 'Filter by project', 'Home');
  await expect(page.locator('.task')).toHaveCount(0);
  await expect(page.getByText('No matching tasks.')).toHaveCount(4);
});
