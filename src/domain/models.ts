import * as z from 'zod/mini';
import { en } from 'zod/locales';

// zod/mini ships without messages; keep the same English wording as the full build.
z.config(en());
export const quadrantIds = ['do', 'schedule', 'delegate', 'eliminate'] as const;
export type QuadrantId = (typeof quadrantIds)[number];
export const categories = ['Work', 'Personal', 'Health', 'Learning'] as const;
export const iconNames = [
  'do',
  'schedule',
  'delegate',
  'eliminate',
  'star',
  'flag',
  'target',
  'briefcase',
  'home',
  'heart',
  'book',
  'bulb',
  'leaf',
  'check',
  'clock',
] as const;
export type IconName = (typeof iconNames)[number];
export const quadrants: ReadonlyArray<{
  id: QuadrantId;
  title: string;
  subtitle: string;
  empty: string;
}> = [
  {
    id: 'do',
    title: 'Do first',
    subtitle: 'Urgent and important',
    empty: 'Start with what needs your attention.',
  },
  {
    id: 'schedule',
    title: 'Schedule',
    subtitle: 'Important, not urgent',
    empty: 'Give your bigger goals some space.',
  },
  {
    id: 'delegate',
    title: 'Delegate',
    subtitle: 'Urgent, not important',
    empty: 'What could someone help you with?',
  },
  {
    id: 'eliminate',
    title: 'Let go',
    subtitle: 'Neither urgent nor important',
    empty: 'Permission to do a little less.',
  },
];
const dateSchema = z
  .string()
  .check(
    z.refine(
      (v) =>
        v === '' ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v),
      'Invalid due date',
    ),
  );
export const subtaskSchema = z.object({
  id: z.string().check(z.minLength(1), z.maxLength(199)),
  title: z.string().check(z.trim(), z.minLength(1), z.maxLength(200)),
  done: z.boolean(),
});
export type Subtask = z.infer<typeof subtaskSchema>;
export const taskSchema = z.object({
  id: z.string().check(z.minLength(1), z.maxLength(199)),
  title: z.string().check(z.trim(), z.minLength(1), z.maxLength(200)),
  q: z.enum(quadrantIds),
  done: z.boolean(),
  notes: z.string().check(z.maxLength(3000)),
  owner: z._default(z.string().check(z.maxLength(100)), ''),
  category: z.union([z.enum(categories), z.literal('')]),
  due: dateSchema,
  created: z.number(),
  projectId: z.optional(z.string().check(z.maxLength(199))),
  isDevSample: z.optional(z.boolean()),
  completedAt: z.optional(z.nullable(z.number())),
  // Optional so old stored tasks and version 1/2 backups remain valid.
  subtasks: z.optional(
    z.array(subtaskSchema).check(
      z.maxLength(100),
      z.refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        'Subtask identifiers must be unique within a task',
      ),
    ),
  ),
});
export type Task = z.infer<typeof taskSchema>;
export const projectSchema = z.object({
  id: z.string().check(z.minLength(1), z.maxLength(199)),
  name: z.string().check(z.trim(), z.minLength(1), z.maxLength(80)),
});
export type Project = z.infer<typeof projectSchema>;
export const matrixSchema = z
  .object({
    tasks: z.array(taskSchema).check(z.maxLength(10000)),
    projects: z.array(projectSchema).check(z.maxLength(1000)),
  })
  .check(
    z.superRefine((state, ctx) => {
      const unique = (values: string[], path: string) => {
        if (new Set(values).size !== values.length)
          ctx.addIssue({ code: 'custom', path: [path], message: 'Duplicate identifiers or names' });
      };
      unique(
        state.tasks.map((t) => t.id),
        'tasks',
      );
      unique(
        state.projects.map((p) => p.id),
        'projects',
      );
      unique(
        state.projects.map((p) => p.name.toLowerCase()),
        'projects',
      );
      const projectIds = new Set(state.projects.map((p) => p.id));
      if (state.tasks.some((t) => t.projectId && !projectIds.has(t.projectId)))
        ctx.addIssue({
          code: 'custom',
          path: ['tasks'],
          message: 'Task references an unknown project',
        });
    }),
  );
export type Matrix = z.infer<typeof matrixSchema>;
export const labelSchema = z.object({
  title: z.string().check(z.trim(), z.minLength(1), z.maxLength(60)),
  subtitle: z.string().check(z.maxLength(180)),
  icon: z.optional(z.enum(iconNames)),
});
export const labelsSchema = z.object({
  do: labelSchema,
  schedule: labelSchema,
  delegate: labelSchema,
  eliminate: labelSchema,
});
export type Labels = z.infer<typeof labelsSchema>;
export const defaultLabels: Labels = Object.fromEntries(
  quadrants.map((q) => [q.id, { title: q.title, subtitle: q.subtitle, icon: q.id }]),
) as Labels;
export type Filters = {
  status: 'active' | 'done' | 'all';
  search: string;
  category: string;
  project: string;
  sort: 'manual' | 'due' | 'new';
};
export const initialFilters: Filters = {
  status: 'active',
  search: '',
  category: '',
  project: '',
  sort: 'manual',
};
export const emptyMatrix: Matrix = { tasks: [], projects: [] };
