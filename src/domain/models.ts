import { z } from 'zod';
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
  .refine(
    (v) =>
      v === '' ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    'Invalid due date',
  );
export const taskSchema = z.object({
  id: z.string().min(1).max(199),
  title: z.string().trim().min(1).max(200),
  q: z.enum(quadrantIds),
  done: z.boolean(),
  notes: z.string().max(3000),
  owner: z.string().max(100).default(''),
  category: z.union([z.enum(categories), z.literal('')]),
  due: dateSchema,
  created: z.number().finite(),
  projectId: z.string().max(199).optional(),
  isDevSample: z.boolean().optional(),
  completedAt: z.number().nullable().optional(),
});
export type Task = z.infer<typeof taskSchema>;
export const projectSchema = z.object({
  id: z.string().min(1).max(199),
  name: z.string().trim().min(1).max(80),
});
export type Project = z.infer<typeof projectSchema>;
export const matrixSchema = z
  .object({ tasks: z.array(taskSchema).max(10000), projects: z.array(projectSchema).max(1000) })
  .superRefine((state, ctx) => {
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
    if (state.tasks.some((t) => t.projectId && !state.projects.some((p) => p.id === t.projectId)))
      ctx.addIssue({
        code: 'custom',
        path: ['tasks'],
        message: 'Task references an unknown project',
      });
  });
export type Matrix = z.infer<typeof matrixSchema>;
export const labelSchema = z.object({
  title: z.string().trim().min(1).max(60),
  subtitle: z.string().max(180),
  icon: z.enum(iconNames).optional(),
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
