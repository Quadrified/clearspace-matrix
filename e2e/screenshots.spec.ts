/*
 * Visual baseline capture. Only runs when SHOTS_DIR is set:
 *   SHOTS_DIR=/tmp/shots-a npx playwright test e2e/screenshots.spec.ts --project=desktop
 * Writes full-page PNGs named <state>.png. Data is fixed, the clock is frozen at
 * 2026-10-15T12:00:00Z (UTC, en-US), motion is reduced and animations/carets are disabled, so two
 * runs on identical code should be byte-identical. Compare two directories with `cmp`.
 * Each state uses its own fresh browser context so shots do not depend on each other.
 */
import { test } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { seedMatrix, setup, openSettings, pickFilter } from './helpers';

const dir = process.env.SHOTS_DIR;
const empty = { tasks: [], projects: [] };

test.skip(!dir, 'Set SHOTS_DIR to capture screenshots');
// Playwright fixtures require the destructuring pattern even when unused.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
  test.skip(
    info.project.name !== 'desktop',
    'Screenshots are produced once, from the desktop project',
  );
});

async function session(
  browser: Browser,
  opts: {
    mobile?: boolean;
    night?: boolean;
    matrix?: unknown;
    labels?: unknown;
    tutorialSeen?: boolean;
  },
  run: (page: Page) => Promise<void>,
  name: string,
) {
  const mobile = !!opts.mobile;
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const page = await context.newPage();
  try {
    await setup(page, {
      matrix: opts.matrix ?? seedMatrix,
      theme: opts.night ? 'night' : 'light',
      tutorialSeen: opts.tutorialSeen ?? true,
    });
    await page.goto('/');
    await page.getByRole('heading', { name: 'Make room for what matters.' }).waitFor();
    await run(page);
    await settle(page);
    mkdirSync(dir!, { recursive: true });
    await page.screenshot({
      path: join(dir!, `${name}.png`),
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  } finally {
    await context.close();
  }
}

async function settle(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    // Let colour transitions (e.g. the dark theme class applied after mount) run to completion.
    await Promise.all(
      document
        .getAnimations()
        .map((a) =>
          a.effect?.getTiming().iterations === Infinity ? null : a.finished.catch(() => null),
        ),
    );
  });
  await page.waitForTimeout(700);
}

const none = async () => {};

test('01 empty board, light', async ({ browser }) => {
  await session(browser, { matrix: empty }, none, '01-empty-light');
});
test('02 empty board, dark', async ({ browser }) => {
  await session(browser, { matrix: empty, night: true }, none, '02-empty-dark');
});
test('03 populated board, light', async ({ browser }) => {
  await session(browser, {}, none, '03-populated-light');
});
test('04 populated board, dark', async ({ browser }) => {
  await session(browser, { night: true }, none, '04-populated-dark');
});
test('05 task editor open', async ({ browser }) => {
  await session(
    browser,
    {},
    async (page) => {
      await page.getByRole('button', { name: 'Edit Send proposal' }).click();
      await page.getByRole('dialog').waitFor();
    },
    '05-task-editor',
  );
});
test('06 projects dialog', async ({ browser }) => {
  await session(
    browser,
    {},
    async (page) => {
      await page.getByRole('button', { name: 'Projects', exact: true }).click();
      await page.getByRole('dialog', { name: 'A place for your projects.' }).waitFor();
    },
    '06-projects-dialog',
  );
});
test('07 settings menu open', async ({ browser }) => {
  await session(browser, {}, openSettings, '07-settings-menu');
});
test('08 completed filter', async ({ browser }) => {
  await session(
    browser,
    {},
    async (page) => {
      await page.getByRole('button', { name: 'Completed', exact: true }).click();
    },
    '08-completed-filter',
  );
});
test('09 mobile populated', async ({ browser }) => {
  await session(browser, { mobile: true }, none, '09-mobile-populated');
});
test('10 mobile with editor open', async ({ browser }) => {
  await session(
    browser,
    { mobile: true },
    async (page) => {
      await page.getByRole('button', { name: 'Edit Send proposal' }).click();
      await page.getByRole('dialog').waitFor();
    },
    '10-mobile-editor',
  );
});
test('11 labels dialog', async ({ browser }) => {
  await session(
    browser,
    {},
    async (page) => {
      await page.getByRole('button', { name: 'Edit Do first title and subtitle' }).click();
      await page.getByRole('dialog', { name: 'Make this matrix yours.' }).waitFor();
    },
    '11-labels-dialog',
  );
});
test('12 tutorial', async ({ browser }) => {
  await session(
    browser,
    { tutorialSeen: false },
    async (page) => {
      await page.locator('#helpDialog').waitFor();
    },
    '12-tutorial',
  );
});
test('13 delete project confirmation', async ({ browser }) => {
  await session(
    browser,
    {},
    async (page) => {
      await page.getByRole('button', { name: 'Projects', exact: true }).click();
      await page.getByRole('button', { name: 'Delete Launch' }).click();
      await page.getByRole('dialog', { name: 'Delete this project?' }).waitFor();
    },
    '13-delete-project',
  );
});
test('14 filters panel open, with search', async ({ browser }) => {
  await session(
    browser,
    {},
    async (page) => {
      await page.getByRole('textbox', { name: 'Find a task' }).fill('o');
      await pickFilter(page, 'Category', 'Work');
      await pickFilter(page, 'Sort tasks', 'Due date');
    },
    '14-filters-panel',
  );
});
test('15 mobile dark with settings', async ({ browser }) => {
  await session(browser, { mobile: true, night: true }, openSettings, '15-mobile-dark-settings');
});
