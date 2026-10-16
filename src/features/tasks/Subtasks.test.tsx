import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import App from '../../App';
import { MATRIX_KEY, parseStoredMatrix } from '../../domain/matrix';

beforeEach(() => localStorage.setItem('clearspace.tutorial.v1', 'seen'));
const stored = () => parseStoredMatrix(localStorage.getItem(MATRIX_KEY));

it('adds subtasks, shows them on the card, persists independent completion and supports Undo', () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add your first task' }));
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Launch website' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add subtask' }));
  expect(screen.getByLabelText('Subtask 1')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Subtask 1'), { target: { value: 'Write copy' } });
  fireEvent.keyDown(screen.getByLabelText('Subtask 1'), { key: 'Enter' });
  expect(screen.getByLabelText('Subtask 2')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Subtask 2'), { target: { value: 'Review design' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  let card = screen.getByRole('article', { name: 'Launch website' });
  expect(within(card).getByText('0 of 2 subtasks done')).toBeInTheDocument();
  expect(within(card).getByText('Write copy')).toBeInTheDocument();
  expect(within(card).getByText('Review design')).toBeInTheDocument();
  fireEvent.click(within(card).getByRole('checkbox', { name: 'Complete subtask: Write copy' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(stored().tasks[0]?.subtasks?.[0]?.done).toBe(true);
  expect(stored().tasks[0]?.done).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(stored().tasks[0]?.subtasks?.[0]?.done).toBe(false);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete subtask: Write copy' }));
  view.unmount();
  render(<App />);
  card = screen.getByRole('article', { name: 'Launch website' });
  expect(within(card).getByRole('checkbox', { name: 'Reopen subtask: Write copy' })).toBeChecked();
  expect(within(card).getByText('1 of 2 subtasks done')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete subtask: Review design' }));
  expect(stored().tasks[0]?.done).toBe(false);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Launch website' }));
  fireEvent.click(screen.getByRole('button', { name: 'All tasks' }));
  expect(screen.getByRole('checkbox', { name: 'Reopen subtask: Write copy' })).toBeChecked();
  expect(stored().tasks[0]?.subtasks?.every((item) => item.done)).toBe(true);
});

it('edits and removes subtasks, skips blank rows, and discards cancelled edits', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add your first task' }));
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Read a book' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add subtask' }));
  fireEvent.change(screen.getByLabelText('Subtask 1'), { target: { value: '  First chapter  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add subtask' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(stored().tasks[0]?.subtasks).toHaveLength(1);
  expect(stored().tasks[0]?.subtasks?.[0]?.title).toBe('First chapter');
  const id = stored().tasks[0]?.subtasks?.[0]?.id;
  fireEvent.click(screen.getByRole('button', { name: 'Edit Read a book' }));
  fireEvent.change(screen.getByLabelText('Subtask 1'), { target: { value: 'Do not save this' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(stored().tasks[0]?.subtasks?.[0]?.title).toBe('First chapter');
  fireEvent.click(screen.getByRole('button', { name: 'Edit Read a book' }));
  fireEvent.change(screen.getByLabelText('Subtask 1'), { target: { value: 'Read chapter one' } });
  fireEvent.click(screen.getByLabelText('Subtask 1 complete'));
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(stored().tasks[0]?.subtasks?.[0]).toEqual({ id, title: 'Read chapter one', done: true });
  fireEvent.change(screen.getByRole('textbox', { name: 'Find a task' }), {
    target: { value: 'chapter one' },
  });
  expect(screen.getByRole('article', { name: 'Read a book' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Read a book' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove subtask 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(stored().tasks[0]?.subtasks).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.queryByRole('list', { name: 'Subtasks for Read a book' })).not.toBeInTheDocument();
});
