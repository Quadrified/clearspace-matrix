import { describe, expect, it } from 'vitest';
import { emptyMatrix } from './models';
import { addExamples, moveTask, removeProject } from './operations';
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
describe('board operations', () => {
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
  it('adds four examples only once', () =>
    expect(addExamples(addExamples(emptyMatrix)).tasks).toHaveLength(4));
});
