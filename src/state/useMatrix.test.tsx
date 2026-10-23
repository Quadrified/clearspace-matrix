import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MATRIX_KEY } from './storage';
import { serializeMatrix } from '../domain/serialization';
import type { Matrix } from '../domain/models';
import { DIALOG_CLOSED } from '../lib/dialogEvents';
import { matrixReducer, useMatrix } from './useMatrix';

const task = (id: string, title: string) => ({
  id,
  title,
  q: 'do' as const,
  done: false,
  notes: '',
  owner: '',
  category: '' as const,
  due: '',
  created: 1,
});
const stored = (...titles: string[]): Matrix => ({
  tasks: titles.map((title, i) => task(`t${i}`, title)),
  projects: [],
});
// Another tab saving: update storage, then deliver the event that the browser would fire.
function otherTabSaves(matrix: Matrix) {
  const newValue = serializeMatrix(matrix);
  localStorage.setItem(MATRIX_KEY, newValue);
  window.dispatchEvent(new StorageEvent('storage', { key: MATRIX_KEY, newValue }));
}
function closeDialog(dialog: HTMLDialogElement) {
  dialog.removeAttribute('open');
  window.dispatchEvent(new Event(DIALOG_CLOSED));
}

it('keeps unreadable saved text so it can still be downloaded for recovery', () => {
  localStorage.setItem(MATRIX_KEY, '{not json');
  const { result } = renderHook(() => useMatrix(vi.fn()));
  expect(result.current.storageError).toMatch(/could not be read/);
  expect(result.current.rawStored).toBe('{not json');
  expect(result.current.matrix.tasks).toEqual([]);
});

it('applies a change from another tab right away when no dialog is open', () => {
  localStorage.setItem(MATRIX_KEY, serializeMatrix(stored('one')));
  const { result } = renderHook(() => useMatrix(vi.fn()));
  act(() => otherTabSaves(stored('one', 'two')));
  expect(result.current.matrix.tasks.map((t) => t.title)).toEqual(['one', 'two']);
});

it('holds a change from another tab while a dialog is open, then applies it when it closes', () => {
  localStorage.setItem(MATRIX_KEY, serializeMatrix(stored('one')));
  const { result } = renderHook(() => useMatrix(vi.fn()));
  const dialog = document.createElement('dialog');
  dialog.setAttribute('open', '');
  document.body.append(dialog);
  act(() => otherTabSaves(stored('one', 'two')));
  expect(result.current.matrix.tasks).toHaveLength(1);
  act(() => {
    closeDialog(dialog);
  });
  expect(result.current.matrix.tasks.map((t) => t.title)).toEqual(['one', 'two']);
  dialog.remove();
});

it('keeps this tab’s newer save instead of replaying an older change from another tab', () => {
  localStorage.setItem(MATRIX_KEY, serializeMatrix(stored('one')));
  const { result } = renderHook(() => useMatrix(vi.fn()));
  const dialog = document.createElement('dialog');
  dialog.setAttribute('open', '');
  document.body.append(dialog);
  act(() => otherTabSaves(stored('one', 'from-other-tab')));
  act(() =>
    result.current.change((m) => ({ ...m, tasks: [...m.tasks, task('mine', 'mine')] }), 'ok'),
  );
  act(() => {
    closeDialog(dialog);
  });
  expect(result.current.matrix.tasks.map((t) => t.title)).toEqual(['one', 'mine']);
  dialog.remove();
});

it('shows a message instead of throwing when a change would make the data invalid', () => {
  const notify = vi.fn();
  const { result } = renderHook(() => useMatrix(notify));
  act(() => result.current.change((m) => ({ ...m, tasks: [task('a', ''), task('a', '')] }), 'x'));
  expect(notify).toHaveBeenCalledWith(expect.stringMatching(/could not be saved/));
  expect(result.current.matrix.tasks).toEqual([]);
});

it('returns stable callbacks so memoized children are not re-rendered', () => {
  const { result, rerender } = renderHook(() => useMatrix(vi.fn()));
  const { change, undo } = result.current;
  rerender();
  expect(result.current.change).toBe(change);
  expect(result.current.undo).toBe(undo);
});
it('Undo restores tasks and projects together after reset', () => {
  const before = { tasks: [task('one', 'Ship')], projects: [{ id: 'p', name: 'Launch' }] };
  const changed = matrixReducer(
    { present: before, previous: null, dirty: false, error: '', rawStored: '' },
    { type: 'change', update: (m) => ({ ...m, tasks: [] }) },
  );
  expect(matrixReducer(changed, { type: 'undo' }).present).toEqual(before);
});
