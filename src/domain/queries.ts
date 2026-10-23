/** Read-only views derived from the board: what each quadrant shows, and progress numbers. */
import { localDate } from './dates';
import type { Filters, Matrix, QuadrantId } from './models';

/** The tasks one quadrant shows for the current status tab, filters, search and sort. */
export function visibleTasks(state: Matrix, q: QuadrantId, f: Filters) {
  const projectNames = new Map(state.projects.map((p) => [p.id, p.name]));
  const search = f.search.toLowerCase();
  const tasks = state.tasks.filter(
    (t) =>
      t.q === q &&
      (f.status === 'all' || (f.status === 'done' ? t.done : !t.done)) &&
      (!f.category || t.category === f.category) &&
      (!f.project || (f.project === '__none' ? !t.projectId : t.projectId === f.project)) &&
      [
        t.title,
        t.notes,
        t.owner,
        t.category,
        projectNames.get(t.projectId ?? '') ?? '',
        ...(t.subtasks ?? []).map((item) => item.title),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search),
  );
  return tasks.sort((a, b) => {
    if (f.status === 'all') {
      const completedLast = Number(a.done) - Number(b.done);
      if (completedLast) return completedLast;
      // Completed tasks retain their completion/manual order below sorted active tasks.
      if (a.done && b.done) return 0;
    }
    return f.sort === 'due'
      ? (a.due || '9999').localeCompare(b.due || '9999')
      : f.sort === 'new'
        ? b.created - a.created
        : 0;
  });
}

export type BoardStats = ReturnType<typeof stats>;

/** Active, due-today and done counts, plus the percentage complete. */
export function stats(state: Matrix, today = localDate()) {
  const active = state.tasks.filter((t) => !t.done),
    done = state.tasks.length - active.length;
  return {
    active: active.length,
    today: active.filter((t) => t.due === today).length,
    done,
    percent: state.tasks.length ? Math.round((done / state.tasks.length) * 100) : 0,
  };
}
