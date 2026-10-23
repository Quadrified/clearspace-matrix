import { expect, it } from 'vitest';
import { initialFilters, taskSchema } from './models';
import type { Matrix } from './models';
import { mergeMatrix, parseBackup, parseStoredMatrix, serializeMatrix } from './serialization';
import { moveTask, toggleSubtask } from './operations';
import { visibleTasks } from './queries';

const task = {
  id: 'parent',
  title: 'Launch',
  q: 'do' as const,
  done: false,
  notes: '',
  owner: '',
  category: 'Work' as const,
  due: '',
  created: 1,
};
const subtasks = [
  { id: 'copy', title: 'Write copy', done: false },
  { id: 'design', title: 'Review design', done: true },
];

it('keeps legacy tasks valid and round-trips subtasks through storage and both backup formats', () => {
  expect(parseStoredMatrix(JSON.stringify([task])).tasks).toEqual([task]);
  const matrix = { tasks: [{ ...task, subtasks }], projects: [] };
  expect(parseStoredMatrix(serializeMatrix(matrix))).toEqual(matrix);
  expect(parseBackup(serializeMatrix(matrix))).toEqual(matrix);
  expect(parseBackup(JSON.stringify({ version: 1, tasks: matrix.tasks }))).toEqual(matrix);
  expect(mergeMatrix({ tasks: [], projects: [] }, matrix)).toMatchObject(matrix);
  expect(moveTask(matrix, task.id, 'schedule').tasks[0]?.subtasks).toEqual(subtasks);
});

it('validates imported subtask data and rejects duplicate identifiers within a task', () => {
  for (const invalid of [
    [{ ...subtasks[0], title: ' ' }],
    [{ ...subtasks[0], title: 'x'.repeat(201) }],
    [{ ...subtasks[0], done: 'yes' }],
    [subtasks[0], subtasks[0]],
    Array.from({ length: 101 }, (_, id) => ({ ...subtasks[0], id: String(id) })),
  ]) {
    expect(taskSchema.safeParse({ ...task, subtasks: invalid }).success).toBe(false);
    expect(() =>
      parseBackup(
        JSON.stringify({ version: 2, tasks: [{ ...task, subtasks: invalid }], projects: [] }),
      ),
    ).toThrow();
  }
});

it('toggles only the requested subtask without mutating, completing, or reordering its parent', () => {
  const state: Matrix = {
    tasks: [
      { ...task, subtasks },
      { ...task, id: 'other' },
    ],
    projects: [],
  };
  const next = toggleSubtask(state, task.id, 'copy');
  expect(next.tasks[0]?.subtasks).toEqual([{ ...subtasks[0], done: true }, subtasks[1]]);
  expect(next.tasks[0]?.done).toBe(false);
  expect(state.tasks[0]?.subtasks?.[0]?.done).toBe(false);
  expect(next.tasks[1]).toBe(state.tasks[1]);
  expect(next.tasks.map((item) => item.id)).toEqual(['parent', 'other']);
  expect(toggleSubtask(state, 'missing', 'copy')).toBe(state);
  expect(toggleSubtask(state, task.id, 'missing')).toBe(state);
  expect(visibleTasks(state, 'do', { ...initialFilters, search: 'review design' })).toEqual([
    state.tasks[0],
  ]);
});
