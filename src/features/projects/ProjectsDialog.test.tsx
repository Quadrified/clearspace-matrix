import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from '../../App';
import { MATRIX_KEY } from '../../domain/matrix';
import type { Matrix, Task } from '../../domain/models';

const task: Task = {
  id: 'proposal',
  title: 'Send the proposal',
  q: 'do',
  done: false,
  notes: '',
  owner: '',
  category: 'Work',
  due: '',
  created: 1,
  projectId: 'launch',
};
const matrix: Matrix = {
  projects: [
    { id: 'launch', name: 'Launch' },
    { id: 'other', name: 'Other project' },
  ],
  tasks: [
    task,
    { ...task, id: 'contract', title: 'Review the contract' },
    { ...task, id: 'report', title: 'Archive the report', done: true },
    { ...task, id: 'other', title: 'Plan next week', projectId: 'other' },
    { ...task, id: 'personal', title: 'Personal task', projectId: '' },
  ],
};
beforeEach(() => {
  localStorage.setItem('clearspace.tutorial.v1', 'seen');
  localStorage.setItem(MATRIX_KEY, JSON.stringify({ version: 2, ...matrix }));
});
function openProjects() {
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  fireEvent.click(screen.getByRole('button', { name: /^Add project/ }));
}
function confirmDeletion() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete Launch' }));
  return screen.getByRole('dialog', { name: 'Delete this project?' });
}
function closeProjects() {
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'A place for your projects.' })).getByRole('button', {
      name: 'Close',
    }),
  );
}
it('warns with the total task count and two examples; Cancel preserves all data', () => {
  render(<App />);
  openProjects();
  const confirmation = confirmDeletion();
  expect(confirmation).toHaveTextContent('Launch contains 3 tasks.');
  expect(confirmation).toHaveTextContent('including completed tasks');
  expect(within(confirmation).getByText('Send the proposal')).toBeInTheDocument();
  expect(within(confirmation).getByText('Review the contract')).toBeInTheDocument();
  expect(within(confirmation).queryByText('Archive the report')).not.toBeInTheDocument();
  expect(confirmation).toHaveTextContent('And 1 more task.');
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog', { name: 'Delete this project?' })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!)).toMatchObject(matrix);
});
it('deletes only the project and its tasks; Undo restores both and their assignments', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('combobox', { name: 'Filter by project' }));
  await userEvent.click(await screen.findByRole('option', { name: 'Launch' }));
  openProjects();
  fireEvent.click(
    within(confirmDeletion()).getByRole('button', { name: 'Delete project and 3 tasks' }),
  );
  const after = JSON.parse(localStorage.getItem(MATRIX_KEY)!);
  expect(after.projects.map((p: { id: string }) => p.id)).toEqual(['other']);
  expect(after.tasks.map((t: Task) => t.id)).toEqual(['other', 'personal']);
  expect(screen.getByRole('combobox', { name: 'Filter by project' })).toHaveTextContent(
    'All projects',
  );
  closeProjects();
  expect(screen.getByText('Plan next week')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!)).toMatchObject(matrix);
});
it('confirms an empty project without inventing task examples', () => {
  localStorage.setItem(
    MATRIX_KEY,
    JSON.stringify({ version: 2, tasks: [], projects: matrix.projects }),
  );
  render(<App />);
  openProjects();
  const confirmation = confirmDeletion();
  expect(confirmation).toHaveTextContent('0 tasks');
  expect(confirmation).toHaveTextContent('This project has no tasks to delete.');
  expect(within(confirmation).queryByRole('list')).not.toBeInTheDocument();
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Delete project' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).projects).toEqual([matrix.projects[1]]);
});
it('keeps a new task draft usable when its selected project is deleted', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a task to Do first' }));
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'My unsaved draft' } });
  await userEvent.click(screen.getByRole('combobox', { name: 'Project' }));
  await userEvent.click(await screen.findByRole('option', { name: 'Launch' }));
  fireEvent.click(screen.getByRole('button', { name: 'Manage projects' }));
  fireEvent.click(
    within(confirmDeletion()).getByRole('button', { name: 'Delete project and 3 tasks' }),
  );
  closeProjects();
  expect(screen.getByLabelText('Task')).toHaveValue('My unsaved draft');
  expect(screen.getByRole('combobox', { name: 'Project' })).toHaveTextContent('No project');
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(screen.getByText('My unsaved draft')).toBeInTheDocument();
});
it('closes the editor when deleting the project that contains the edited task', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Send the proposal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Manage projects' }));
  fireEvent.click(
    within(confirmDeletion()).getByRole('button', { name: 'Delete project and 3 tasks' }),
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit Send the proposal' })).not.toBeInTheDocument();
});
