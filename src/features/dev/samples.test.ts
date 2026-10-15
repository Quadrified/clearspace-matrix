import { it, expect } from 'vitest';
import { createSamples } from './samples';
import { categories, matrixSchema, quadrantIds } from '../../domain/models';
import { mergeMatrix } from '../../domain/matrix';

it('generates 24 valid marked tasks, three projects and realistic testing states', () => {
  const data = matrixSchema.parse(createSamples('2026-10-15'));
  expect(data.tasks).toHaveLength(24);
  expect(data.projects).toHaveLength(3);
  expect(new Set(data.tasks.map((task) => task.id)).size).toBe(24);
  for (const q of quadrantIds) expect(data.tasks.filter((task) => task.q === q)).toHaveLength(6);
  for (const category of categories)
    expect(data.tasks.filter((task) => task.category === category)).toHaveLength(6);
  expect(data.tasks.every((task) => task.isDevSample)).toBe(true);
  expect(data.tasks.some((task) => task.done)).toBe(true);
  expect(data.tasks.some((task) => task.due === '2026-10-15')).toBe(true);
  expect(data.tasks.some((task) => task.due && task.due < '2026-10-15')).toBe(true);
  expect(data.tasks.some((task) => task.due > '2026-10-15')).toBe(true);
  expect(data.tasks.some((task) => !task.due)).toBe(true);
  expect(data.tasks.some((task) => task.notes.includes('\n'))).toBe(true);
});

it('reuses Dev projects across sample runs while creating different tasks', () => {
  const first = createSamples('2026-10-15'),
    second = createSamples('2026-10-15');
  const combined = mergeMatrix(first, second);
  expect(combined.tasks).toHaveLength(48);
  expect(combined.projects).toHaveLength(3);
});

it('rejects invalid dates', () => {
  for (const date of ['bad', '2026-02-30', '2026-13-01'])
    expect(() => createSamples(date)).toThrow();
});
