import { describe, expect, it } from 'vitest';
import { initialFilters } from './models';
import { toggleTask } from './operations';
import { stats, visibleTasks } from './queries';
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
describe('board views', () => {
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
});

describe('completed task ordering', () => {
  const state = {
    projects: [],
    tasks: [
      { ...task, id: 'first', created: 1, due: '2026-10-20' },
      { ...task, id: 'old-done', done: true, created: 9, due: '2026-10-10', completedAt: 10 },
      { ...task, id: 'second', created: 2, due: '2026-10-19' },
      { ...task, id: 'other-quadrant', q: 'schedule' as const },
    ],
  };
  it.each(['manual', 'due', 'new'] as const)(
    'puts a newly completed task last in All tasks with %s sorting',
    (sort) => {
      const next = toggleTask(state, 'first', 20);
      const result = visibleTasks(next, 'do', { ...initialFilters, status: 'all', sort });
      expect(result.map((task) => task.id)).toEqual(['second', 'old-done', 'first']);
      expect(next.tasks.find((task) => task.id === 'first')?.completedAt).toBe(20);
      expect(state.tasks[0]!.done).toBe(false);
      expect(
        visibleTasks(next, 'schedule', { ...initialFilters, status: 'all' }).map((task) => task.id),
      ).toEqual(['other-quadrant']);
    },
  );
  it('keeps active sorting and returns reopened tasks to the active group', () => {
    expect(
      visibleTasks(state, 'do', { ...initialFilters, status: 'all', sort: 'due' }).map(
        (task) => task.id,
      ),
    ).toEqual(['second', 'first', 'old-done']);
    const reopened = toggleTask(toggleTask(state, 'first', 20), 'first', 30);
    expect(
      visibleTasks(reopened, 'do', { ...initialFilters, status: 'all' }).map((task) => task.id),
    ).toEqual(['second', 'first', 'old-done']);
    expect(reopened.tasks.find((task) => task.id === 'first')?.completedAt).toBeNull();
  });
});
