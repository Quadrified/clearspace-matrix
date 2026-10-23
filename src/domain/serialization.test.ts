import { describe, expect, it } from 'vitest';
import { mergeMatrix, parseBackup, parseStoredMatrix, serializeMatrix } from './serialization';
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
