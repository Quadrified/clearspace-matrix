import { describe, it, expect } from 'vitest';
import {
  addExamples,
  mergeMatrix,
  moveTask,
  parseBackup,
  parseStoredMatrix,
  removeProject,
  serializeMatrix,
  stats,
  visibleTasks,
} from './matrix';
import { emptyMatrix, initialFilters } from './models';
import { matrixReducer } from '../lib/useMatrix';
const task = {
  id: 'one',
  title: 'Ship',
  q: 'do' as const,
  done: false,
  notes: '',
  owner: '',
  category: 'Work' as const,
  due: '2026-10-15',
  created: 1,
};
describe('storage and backups', () => {
  it('reads the original task-array format without changing task IDs', () =>
    expect(parseStoredMatrix(JSON.stringify([task]))).toEqual({ tasks: [task], projects: [] }));
  it('round-trips current projects, Dev markers, legacy owner and completedAt', () => {
    const matrix = {
      projects: [{ id: 'p', name: 'Launch' }],
      tasks: [{ ...task, owner: 'Teammate', projectId: 'p', isDevSample: true, completedAt: null }],
    };
    expect(parseStoredMatrix(serializeMatrix(matrix))).toEqual(matrix);
    expect(parseBackup(serializeMatrix(matrix))).toEqual(matrix);
  });
  it('accepts version-one backups', () =>
    expect(parseBackup(JSON.stringify({ version: 1, tasks: [task] }))).toEqual({
      tasks: [task],
      projects: [],
    }));
  it('rejects corrupt values, duplicate IDs and dangling project assignments', () => {
    for (const value of [
      'bad',
      JSON.stringify({ version: 2, tasks: [task, task], projects: [] }),
      JSON.stringify({ version: 2, tasks: [{ ...task, projectId: 'missing' }], projects: [] }),
    ])
      expect(() => parseBackup(value)).toThrow();
  });
  it('reconciles incoming projects by case-insensitive name', () => {
    const merged = mergeMatrix(
      { projects: [{ id: 'a', name: 'Launch' }], tasks: [] },
      { projects: [{ id: 'b', name: 'LAUNCH' }], tasks: [{ ...task, projectId: 'b' }] },
    );
    expect(merged.projects).toHaveLength(1);
    expect(merged.tasks[0]?.projectId).toBe('a');
  });
});
describe('matrix operations', () => {
  it('removes a project and its tasks, keeping unrelated tasks', () => {
    expect(
      removeProject(
        {
          projects: [{ id: 'p', name: 'Launch' }],
          tasks: [
            { ...task, projectId: 'p' },
            { ...task, id: 'done', projectId: 'p', done: true },
            { ...task, id: 'unrelated' },
          ],
        },
        'p',
      ),
    ).toEqual({ projects: [], tasks: [{ ...task, id: 'unrelated' }] });
  });
  it('moves and reorders using stable IDs', () => {
    const state = { projects: [], tasks: [task, { ...task, id: 'two' }] };
    expect(moveTask(state, 'two', 'schedule', 'one').tasks.map((t) => [t.id, t.q])).toEqual([
      ['two', 'schedule'],
      ['one', 'do'],
    ]);
    expect(moveTask(state, 'one', 'do', 'one')).toBe(state);
  });
  it('filters by project and searches project names', () => {
    const state = {
      projects: [{ id: 'p', name: 'Launch' }],
      tasks: [
        { ...task, projectId: 'p' },
        { ...task, id: 'two' },
      ],
    };
    expect(visibleTasks(state, 'do', { ...initialFilters, search: 'launch' })).toHaveLength(1);
    expect(visibleTasks(state, 'do', { ...initialFilters, project: '__none' })[0]?.id).toBe('two');
  });
  it('derives counts from tasks and does not count completed due tasks as due today', () =>
    expect(
      stats({ projects: [], tasks: [task, { ...task, id: 'two', done: true }] }, '2026-10-15'),
    ).toEqual({ active: 1, today: 1, done: 1, percent: 50 }));
  it('adds four examples only once', () =>
    expect(addExamples(addExamples(emptyMatrix)).tasks).toHaveLength(4));
  it('Undo restores tasks and projects together after reset', () => {
    const before = { tasks: [task], projects: [{ id: 'p', name: 'Launch' }] };
    const changed = matrixReducer(
      { present: before, previous: null, dirty: false, error: '' },
      { type: 'change', update: (m) => ({ ...m, tasks: [] }) },
    );
    expect(matrixReducer(changed, { type: 'undo' }).present).toEqual(before);
  });
});
