/* Projects dialog: create, rename, delete (with the destructive-confirm text), plus the editor link. */
import { test, expect } from '@playwright/test';
import { open, seedMatrix, storedMatrix, toast, editorDialog, pickFilter } from './helpers';

const projectsDialog = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: 'A place for your projects.' });

async function openProjects(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await expect(projectsDialog(page)).toBeVisible();
}

test('create a project and validate names', async ({ page }) => {
  await open(page, { matrix: { tasks: [], projects: [] } });
  await openProjects(page);
  const dialog = projectsDialog(page);
  await dialog.getByRole('button', { name: 'Add project' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Write a project name first.');
  await dialog.getByPlaceholder('Project name').fill('Garden');
  await dialog.getByRole('button', { name: 'Add project' }).click();
  await expect(toast(page)).toContainText('Project added.');
  await expect(dialog.getByRole('textbox', { name: 'Project name: Garden' })).toBeVisible();
  await dialog.getByPlaceholder('Project name').fill('garden');
  await dialog.getByRole('button', { name: 'Add project' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('A project with that name already exists.');
  expect((await storedMatrix(page)).projects.map((p: { name: string }) => p.name)).toEqual([
    'Garden',
  ]);
});

test('rename a project and see it on tasks and in the filter', async ({ page }) => {
  await open(page, { matrix: seedMatrix });
  await openProjects(page);
  const dialog = projectsDialog(page);
  const input = dialog.getByRole('textbox', { name: 'Project name: Launch' });
  await input.fill('Home');
  await input.locator('xpath=following-sibling::button[1]').click();
  await expect(dialog.getByRole('alert')).toHaveText('A project with that name already exists.');
  await input.fill('Product launch');
  await input.locator('xpath=following-sibling::button[1]').click();
  await expect(toast(page)).toContainText('Project updated.');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-task-id="t-proposal"] .project-tag')).toHaveText(
    'Product launch',
  );
  await pickFilter(page, 'Project', 'Product launch');
  await expect(page.locator('.task-title')).toHaveText(['Send proposal']);
});

test('delete a project: confirm dialog warns that its tasks are deleted, cancel keeps them', async ({
  page,
}) => {
  await open(page, { matrix: seedMatrix });
  await openProjects(page);
  const dialog = projectsDialog(page);
  await dialog.getByRole('button', { name: 'Delete Launch' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this project?' });
  await expect(confirm).toBeVisible();
  await expect(confirm.locator('.project-delete-summary')).toHaveText(
    'Launch contains 2 tasks. Deleting this project will also delete all of these tasks, including completed tasks.',
  );
  await expect(confirm.locator('.project-delete-tasks li')).toHaveText([
    'Send proposal',
    'Finish slidesCompleted',
  ]);
  await expect(confirm).toContainText('You can undo this deletion.');
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  expect((await storedMatrix(page)).tasks).toHaveLength(8);

  await dialog.getByRole('button', { name: 'Delete Launch' }).click();
  await confirm.getByRole('button', { name: 'Delete project and 2 tasks' }).click();
  await expect(toast(page)).toContainText('Project and 2 tasks deleted.');
  const stored = await storedMatrix(page);
  expect(stored.projects.map((p: { name: string }) => p.name)).toEqual(['Home']);
  expect(stored.tasks).toHaveLength(6);
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('button', { name: 'Edit Send proposal' })).toHaveCount(0);

  await toast(page).getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Edit Send proposal' })).toBeVisible();
  expect((await storedMatrix(page)).projects).toHaveLength(2);
});

test('deleting an empty project says there is nothing to delete', async ({ page }) => {
  await open(page, { matrix: { tasks: [], projects: [{ id: 'p-x', name: 'Empty one' }] } });
  await openProjects(page);
  await projectsDialog(page).getByRole('button', { name: 'Delete Empty one' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this project?' });
  await expect(confirm.locator('.project-delete-summary')).toHaveText(
    'Empty one contains 0 tasks. This project has no tasks to delete.',
  );
  await confirm.getByRole('button', { name: 'Delete project', exact: true }).click();
  await expect(toast(page)).toContainText('Project deleted.');
  expect((await storedMatrix(page)).projects).toEqual([]);
});

test('project can be created from the task editor and is selected', async ({ page }) => {
  await open(page, { matrix: { tasks: [], projects: [] } });
  await page.getByRole('button', { name: 'Add your first task' }).click();
  const editor = editorDialog(page);
  await editor.getByRole('button', { name: 'Manage projects' }).click();
  const dialog = projectsDialog(page);
  await dialog.getByPlaceholder('Project name').fill('Taxes');
  await dialog.getByRole('button', { name: 'Add project' }).click();
  await expect(dialog).toBeHidden();
  await expect(editor.getByRole('combobox', { name: 'Project' })).toContainText('Taxes');
  await editor.getByPlaceholder('What do you need to do?').fill('File return');
  await editor.getByRole('button', { name: 'Save task' }).click();
  await expect(page.locator('.project-tag')).toHaveText('Taxes');
});
