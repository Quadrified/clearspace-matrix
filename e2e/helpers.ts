/*
 * Shared helpers for the Playwright regression suite (see README note in e2e/app.spec.ts).
 * Not a spec file: it only holds fixed seed data and small page utilities.
 */
import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export const MATRIX_KEY = 'clearspace.matrix.v1';
export const FROZEN = '2026-10-15T12:00:00';

type Seed = {
  matrix?: unknown;
  /** Raw string stored under the matrix key (overrides `matrix`). */
  rawMatrix?: string;
  labels?: unknown;
  theme?: 'night' | 'light';
  size?: number;
  tutorialSeen?: boolean;
};

const task = (o: Record<string, unknown>) => ({
  owner: '',
  notes: '',
  category: '',
  due: '',
  done: false,
  ...o,
});

/** Fixed, deterministic board used by most specs (today is 2026-10-15). */
export const seedMatrix = {
  projects: [
    { id: 'p-launch', name: 'Launch' },
    { id: 'p-home', name: 'Home' },
  ],
  tasks: [
    task({
      id: 't-proposal',
      title: 'Send proposal',
      q: 'do',
      category: 'Work',
      due: '2026-10-15',
      projectId: 'p-launch',
      created: 1000,
      notes: 'Final review with the team first.',
    }),
    task({
      id: 't-invoice',
      title: 'Pay invoice',
      q: 'do',
      category: 'Personal',
      due: '2026-10-10',
      created: 2000,
    }),
    task({
      id: 't-slides',
      title: 'Finish slides',
      q: 'do',
      category: 'Work',
      projectId: 'p-launch',
      created: 2500,
      done: true,
      completedAt: 2600,
    }),
    task({
      id: 't-workout',
      title: 'Plan workout',
      q: 'schedule',
      category: 'Health',
      due: '2026-10-20',
      created: 3000,
    }),
    task({
      id: 't-dentist',
      title: 'Call dentist',
      q: 'schedule',
      category: 'Health',
      due: '2026-10-25',
      created: 5000,
    }),
    task({
      id: 't-book',
      title: 'Read book',
      q: 'schedule',
      category: 'Learning',
      due: '2026-10-18',
      projectId: 'p-home',
      created: 4000,
      notes: 'Chapter three.',
    }),
    task({
      id: 't-notes',
      title: 'Format meeting notes',
      q: 'delegate',
      category: 'Work',
      owner: 'Sam',
      created: 6000,
    }),
    task({
      id: 't-feed',
      title: 'Scroll the feed',
      q: 'eliminate',
      category: 'Personal',
      created: 7000,
    }),
  ],
};

/**
 * Runs before app code on every navigation of this page. Storage is seeded only on the first
 * load of the tab (sessionStorage guard), so reloads keep whatever the test changed.
 */
export async function setup(page: Page, seed: Seed = {}) {
  const { tutorialSeen = true } = seed;
  await page.clock.setFixedTime(FROZEN + 'Z');
  await page.addInitScript(
    ({ seed, tutorialSeen, key }) => {
      try {
        if (sessionStorage.getItem('__e2e_seeded')) return;
        sessionStorage.setItem('__e2e_seeded', '1');
        if (tutorialSeen) localStorage.setItem('clearspace.tutorial.v1', 'seen');
        if (seed.rawMatrix !== undefined) localStorage.setItem(key, seed.rawMatrix);
        else if (seed.matrix)
          localStorage.setItem(key, JSON.stringify({ version: 2, ...seed.matrix }));
        if (seed.labels)
          localStorage.setItem('clearspace.labels.v1', JSON.stringify({ quadrants: seed.labels }));
        if (seed.theme) localStorage.setItem('clearspace.theme', seed.theme);
        if (seed.size) localStorage.setItem('clearspace.fontSize.v1', String(seed.size));
      } catch {
        /* storage unavailable */
      }
    },
    { seed, tutorialSeen, key: MATRIX_KEY },
  );
}

export async function open(page: Page, seed: Seed = {}) {
  await setup(page, seed);
  await page.goto('/');
  await expect(page.locator('#matrix')).toBeVisible();
}

export const quadrant = (page: Page, title: string): Locator =>
  page.locator('section.quad', { has: page.getByRole('heading', { name: title, exact: true }) });

/** Task titles in one quadrant, in DOM order. */
export const titles = (q: Locator) => q.locator('.task-title').allTextContents();

export const toast = (page: Page) => page.getByRole('status');

export const storedMatrix = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), MATRIX_KEY);

export async function openSettings(page: Page) {
  const button = page.getByRole('button', { name: 'Settings' });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
}

/** Picks Auto, Light or Dark under Settings > Appearance, then closes Settings. */
export async function chooseAppearance(page: Page, name: 'Auto' | 'Light' | 'Dark') {
  await openSettings(page);
  await page.getByRole('button', { name, exact: true }).click();
  await page.keyboard.press('Escape');
}

export async function choose(
  page: Page,
  selectLabel: string,
  option: string,
  scope: Page | Locator = page,
) {
  await scope.getByRole('combobox', { name: selectLabel, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

export const editorDialog = (page: Page) => page.getByRole('dialog', { name: /^(New|Edit) task$/ });

/** Opens the Filters panel if it is closed. */
export async function openFilters(page: Page) {
  const button = page.getByRole('button', { name: /^Filters/ });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await expect(page.locator('#filtersPanel')).toBeVisible();
}

/** Toggles one chip (or sort option) in the Filters panel, e.g. pickFilter(page, 'Category', 'Work'). */
export async function pickFilter(page: Page, group: string, option: string) {
  await openFilters(page);
  await page
    .locator('#filtersPanel')
    .getByRole('group', { name: group, exact: true })
    .getByRole('button', { name: option, exact: true })
    .click();
}
