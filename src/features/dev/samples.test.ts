import { it, expect, vi } from 'vitest';
import { createSamples } from './samples';
import { categories, matrixSchema, quadrantIds } from '../../domain/models';
import { mergeMatrix } from '../../domain/serialization';

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

it('randomly selects half the tasks for two to four valid subtasks without changing task order', () => {
  const random = vi.spyOn(Math, 'random');
  try {
    random.mockReturnValue(0);
    const first = matrixSchema.parse(createSamples('2026-10-15'));
    random.mockReturnValue(0.999);
    const second = matrixSchema.parse(createSamples('2026-10-15'));
    const selected = (matrix: typeof first) => matrix.tasks.filter((task) => task.subtasks?.length);
    expect(selected(first)).toHaveLength(12);
    expect(selected(second)).toHaveLength(12);
    expect(selected(first).map((task) => task.title)).not.toEqual(
      selected(second).map((task) => task.title),
    );
    expect(first.tasks.map((task) => task.title)).toEqual(second.tasks.map((task) => task.title));
    for (const matrix of [first, second]) {
      const allSteps = selected(matrix).flatMap((task) => task.subtasks ?? []);
      expect(new Set(allSteps.map((step) => step.id)).size).toBe(allSteps.length);
      expect(allSteps.some((step) => step.done)).toBe(true);
      expect(allSteps.some((step) => !step.done)).toBe(true);
      for (const task of selected(matrix)) {
        expect(task.subtasks!.length).toBeGreaterThanOrEqual(2);
        expect(task.subtasks!.length).toBeLessThanOrEqual(4);
        if (task.done) expect(task.subtasks!.every((step) => step.done)).toBe(true);
      }
    }
    expect(selected(first).every((task) => task.subtasks?.length === 2)).toBe(true);
    expect(selected(second).every((task) => task.subtasks?.length === 4)).toBe(true);
  } finally {
    random.mockRestore();
  }
});
