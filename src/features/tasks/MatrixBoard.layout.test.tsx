import { readFile } from 'node:fs/promises';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../../App';
import { MotionProvider } from '../../lib/motion';
import { MATRIX_KEY } from '../../domain/matrix';
import { createSamples } from '../dev/samples';

afterEach(() => {
  document.getElementById('task-layout-test-styles')?.remove();
  vi.unstubAllEnvs();
});
it('keeps task cards in normal block flow while an outgoing empty state is still fading', async () => {
  // Exercise real presence, not the synchronous wrappers used in ordinary DOM tests.
  vi.stubEnv('MODE', 'development');
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));
  const css = await readFile('src/styles.css', 'utf8');
  const style = document.createElement('style');
  style.id = 'task-layout-test-styles';
  const layoutCss = (css.match(/\.tasklist[^{}]*\{[^{}]*\}/g) ?? []).join('\n');
  style.textContent = layoutCss;
  document.head.append(style);
  localStorage.setItem('clearspace.tutorial.v1', 'seen');
  localStorage.setItem(MATRIX_KEY, JSON.stringify({ version: 2, ...createSamples('2026-10-15') }));
  render(
    <MotionProvider>
      <App />
    </MotionProvider>,
  );
  const list = screen
    .getByRole('region', { name: 'Do first, Urgent and important' })
    .querySelector('.tasklist')!;
  fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
  await waitFor(() => expect(list.querySelectorAll('.task-shell')).toHaveLength(0));
  expect(list.querySelector('.empty')).not.toBeNull();
  style.textContent = layoutCss;
  expect(getComputedStyle(list).display).toBe('flex');
  fireEvent.click(screen.getByRole('button', { name: 'All tasks' }));
  // Keep cards at full width even while the outgoing empty state remains mounted.
  expect(list.querySelector('.empty')).not.toBeNull();
  expect(list.querySelectorAll('.task-shell')).toHaveLength(6);
  style.textContent = layoutCss;
  expect(getComputedStyle(list).display).toBe('block');
  await waitFor(() => expect(list.querySelector('.empty')).toBeNull());
  expect(getComputedStyle(list).display).toBe('block');
});
