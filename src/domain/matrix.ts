import { matrixSchema, taskSchema, emptyMatrix } from './models';
import type { Matrix, Task, Filters, QuadrantId } from './models';
import { z } from 'zod';
export const MATRIX_KEY = 'clearspace.matrix.v1';
export function parseStoredMatrix(raw: string | null): Matrix {
  if (!raw) return structuredClone(emptyMatrix);
  const value: unknown = JSON.parse(raw);
  return matrixSchema.parse(Array.isArray(value) ? { tasks: value, projects: [] } : value);
}
export function serializeMatrix(state: Matrix) {
  return JSON.stringify({ version: 2, ...state });
}
const backupSchema = z.discriminatedUnion('version', [
  z.object({ version: z.literal(1), tasks: z.array(taskSchema) }),
  z.object({
    version: z.literal(2),
    tasks: z.array(taskSchema),
    projects: matrixSchema.shape.projects,
  }),
]);
export function parseBackup(raw: string): Matrix {
  if (raw.length > 5_000_000) throw Error('Backup too large');
  const value = backupSchema.parse(JSON.parse(raw) as unknown);
  return matrixSchema.parse({
    tasks: value.tasks,
    projects: value.version === 1 ? [] : value.projects,
  });
}
export function mergeMatrix(state: Matrix, incoming: Matrix): Matrix {
  const projects = new Map(state.projects.map((p) => [p.id, p]));
  const remap = new Map<string, string>();
  for (const project of incoming.projects) {
    const existing = [...projects.values()].find(
      (p) => p.id !== project.id && p.name.toLowerCase() === project.name.toLowerCase(),
    );
    if (existing) remap.set(project.id, existing.id);
    else projects.set(project.id, project);
  }
  const tasks = new Map(state.tasks.map((t) => [t.id, t]));
  for (const task of incoming.tasks)
    tasks.set(task.id, {
      ...task,
      projectId: remap.get(task.projectId ?? '') ?? task.projectId ?? '',
    });
  return matrixSchema.parse({ tasks: [...tasks.values()], projects: [...projects.values()] });
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function visibleTasks(state: Matrix, q: QuadrantId, f: Filters) {
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
        state.projects.find((p) => p.id === t.projectId)?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(f.search.toLowerCase()),
  );
  return f.sort === 'due'
    ? tasks.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
    : f.sort === 'new'
      ? tasks.sort((a, b) => b.created - a.created)
      : tasks;
}
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
export function moveTask(state: Matrix, id: string, q: QuadrantId, beforeId?: string): Matrix {
  const task = state.tasks.find((t) => t.id === id);
  if (!task || id === beforeId) return state;
  const tasks = state.tasks.filter((t) => t.id !== id);
  const index = beforeId ? tasks.findIndex((t) => t.id === beforeId) : -1;
  tasks.splice(index < 0 ? tasks.length : index, 0, { ...task, q });
  return { ...state, tasks };
}
export function removeProject(state: Matrix, id: string): Matrix {
  return {
    projects: state.projects.filter((p) => p.id !== id),
    tasks: state.tasks.filter((task) => task.projectId !== id),
  };
}
export function projectNameError(state: Matrix, name: string, id?: string) {
  if (!name.trim()) return 'Write a project name first.';
  if (name.trim().length > 80) return 'Keep project names under 81 characters.';
  if (state.projects.some((p) => p.id !== id && p.name.toLowerCase() === name.trim().toLowerCase()))
    return 'A project with that name already exists.';
  return '';
}
export function addExamples(state: Matrix): Matrix {
  const samples: Array<[string, QuadrantId, Task['category']]> = [
    ['Send the proposal before the deadline', 'do', 'Work'],
    ['Plan a workout for this week', 'schedule', 'Health'],
    ['Ask a teammate for the meeting notes', 'delegate', 'Work'],
    ['Skip the extra social media scroll', 'eliminate', 'Personal'],
  ];
  const tasks = [...state.tasks];
  for (const [title, q, category] of samples)
    if (
      !tasks.some(
        (t) =>
          t.id === `clearspace-example-${q}` ||
          (t.title === title &&
            t.notes === 'Example task. Edit or delete it to make this space yours.'),
      )
    )
      tasks.push({
        id: `clearspace-example-${q}`,
        title,
        q,
        category,
        done: false,
        notes: 'Example task. Edit or delete it to make this space yours.',
        owner: '',
        due: '',
        created: Date.now(),
      });
  return { ...state, tasks };
}
