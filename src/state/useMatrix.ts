/**
 * The board's single source of truth. `useMatrix` holds the current tasks and projects, applies
 * changes from the pure functions in `domain/operations`, validates every result, saves it to
 * localStorage, keeps one step of Undo, and picks up changes made in other tabs.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { emptyMatrix, matrixSchema } from '../domain/models';
import type { Matrix } from '../domain/models';
import { parseStoredMatrix, serializeMatrix } from '../domain/serialization';
import { DIALOG_CLOSED } from '../lib/dialogEvents';
import { MATRIX_KEY, readStorage, writeStorage } from './storage';

/** Applies a change to the board and shows `message` in a toast with Undo. */
export type ChangeMatrix = (update: (m: Matrix) => Matrix, message: string) => void;
type State = {
  present: Matrix;
  previous: Matrix | null;
  dirty: boolean;
  error: string;
  // Unreadable saved data, kept verbatim so it can still be downloaded for recovery.
  rawStored: string;
};
type Action =
  | { type: 'change'; update: (m: Matrix) => Matrix }
  | { type: 'undo' }
  | { type: 'external'; value: Matrix };
function initialize(): State {
  // Blocked storage and unreadable data both land in the catch, which keeps edits in memory only.
  try {
    return {
      present: parseStoredMatrix(localStorage.getItem(MATRIX_KEY)),
      previous: null,
      dirty: false,
      error: '',
      rawStored: '',
    };
  } catch {
    return {
      present: structuredClone(emptyMatrix),
      previous: null,
      dirty: false,
      error:
        'Saved tasks could not be read. Export or recover your browser data before making changes.',
      rawStored: readStorage(MATRIX_KEY) ?? '',
    };
  }
}
export function matrixReducer(state: State, action: Action): State {
  if (action.type === 'external')
    return { ...state, present: action.value, previous: null, dirty: false };
  if (action.type === 'undo')
    return state.previous
      ? { ...state, present: state.previous, previous: null, dirty: true }
      : state;
  return { ...state, present: action.update(state.present), previous: state.present, dirty: true };
}
export function useMatrix(notify: (s: string, undo?: boolean) => void) {
  const [state, dispatch] = useReducer(matrixReducer, undefined, initialize);
  const current = useRef(state.present);
  current.current = state.present;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  // A change made in another tab while a dialog is open waits here until the dialog closes.
  const waiting = useRef<{ raw: string | null } | null>(null);
  const editedSinceWaiting = useRef(false);
  useEffect(() => {
    if (!state.dirty || state.error) return;
    if (!writeStorage(MATRIX_KEY, serializeMatrix(state.present)))
      notifyRef.current('Browser storage is unavailable. Export a backup before leaving.');
  }, [state.present, state.dirty, state.error]);
  useEffect(() => {
    if (state.error) notifyRef.current(state.error);
  }, [state.error]);
  useEffect(() => {
    const apply = (raw: string | null) => {
      try {
        dispatch({ type: 'external', value: parseStoredMatrix(raw) });
      } catch {
        notifyRef.current('Changes in another tab could not be read.');
      }
    };
    const listener = (e: StorageEvent) => {
      if (e.key !== MATRIX_KEY) return;
      if (document.querySelector('dialog[open]')) {
        waiting.current = { raw: e.newValue };
        editedSinceWaiting.current = false;
        return;
      }
      apply(e.newValue);
    };
    const closed = () => {
      const pending = waiting.current;
      if (!pending || document.querySelector('dialog[open]')) return;
      waiting.current = null;
      // If this tab saved after the other tab did, storage already holds this tab's newer state.
      if (!editedSinceWaiting.current) apply(pending.raw);
    };
    window.addEventListener('storage', listener);
    window.addEventListener(DIALOG_CLOSED, closed);
    return () => {
      window.removeEventListener('storage', listener);
      window.removeEventListener(DIALOG_CLOSED, closed);
    };
  }, []);
  const change = useCallback((update: (m: Matrix) => Matrix, message: string) => {
    let next: Matrix;
    try {
      next = matrixSchema.parse(update(current.current));
    } catch {
      notifyRef.current('That change could not be saved. Your tasks were not changed.');
      return;
    }
    editedSinceWaiting.current = true;
    current.current = next;
    dispatch({ type: 'change', update: () => next });
    notifyRef.current(message, true);
  }, []);
  const undo = useCallback(() => {
    editedSinceWaiting.current = true;
    dispatch({ type: 'undo' });
  }, []);
  return useMemo(
    () => ({
      matrix: state.present,
      change,
      undo,
      canUndo: !!state.previous,
      storageError: state.error,
      rawStored: state.rawStored,
    }),
    [state.present, state.previous, state.error, state.rawStored, change, undo],
  );
}
