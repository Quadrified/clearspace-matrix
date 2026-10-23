/**
 * Reading and writing the board as text: the saved browser format, JSON backups, and merging an
 * imported backup into the current board. Every path validates through the Zod schemas.
 */
import * as z from 'zod/mini';
import { emptyMatrix, matrixSchema, taskSchema } from './models';
import type { Matrix } from './models';

/** Parses saved board text. Accepts the original bare task array as well as the current format. */
export function parseStoredMatrix(raw: string | null): Matrix {
  if (!raw) return structuredClone(emptyMatrix);
  const value: unknown = JSON.parse(raw);
  return matrixSchema.parse(Array.isArray(value) ? { tasks: value, projects: [] } : value);
}

/** The saved format and the backup format are the same version-2 JSON document. */
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

/** Parses a version-1 (tasks only) or version-2 (tasks and projects) backup file. */
export function parseBackup(raw: string): Matrix {
  if (raw.length > 5_000_000) throw Error('Backup too large');
  const value = backupSchema.parse(JSON.parse(raw) as unknown);
  return matrixSchema.parse({
    tasks: value.tasks,
    projects: value.version === 1 ? [] : value.projects,
  });
}

/**
 * Merges an imported board into the current one. Tasks merge by ID; projects with the same name
 * (ignoring case) are treated as one project and their tasks are reassigned to it.
 */
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
