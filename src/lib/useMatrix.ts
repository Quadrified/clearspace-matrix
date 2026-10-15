import { useEffect, useReducer, useRef } from 'react';
import { emptyMatrix, matrixSchema } from '../domain/models';
import type { Matrix } from '../domain/models';
import { MATRIX_KEY, parseStoredMatrix, serializeMatrix } from '../domain/matrix';
type State = { present: Matrix; previous: Matrix | null; dirty: boolean; error: string };
type Action =
  | { type: 'change'; update: (m: Matrix) => Matrix }
  | { type: 'undo' }
  | { type: 'external'; value: Matrix };
function initialize(): State {
  try {
    return {
      present: parseStoredMatrix(localStorage.getItem(MATRIX_KEY)),
      previous: null,
      dirty: false,
      error: '',
    };
  } catch {
    return {
      present: structuredClone(emptyMatrix),
      previous: null,
      dirty: false,
      error:
        'Saved tasks could not be read. Export or recover your browser data before making changes.',
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
  useEffect(() => {
    if (!state.dirty || state.error) return;
    try {
      localStorage.setItem(MATRIX_KEY, serializeMatrix(state.present));
    } catch {
      notifyRef.current('Browser storage is unavailable. Export a backup before leaving.');
    }
  }, [state.present, state.dirty, state.error]);
  useEffect(() => {
    if (state.error) notifyRef.current(state.error);
  }, [state.error]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key !== MATRIX_KEY || document.querySelector('dialog[open]')) return;
      try {
        dispatch({ type: 'external', value: parseStoredMatrix(e.newValue) });
      } catch {
        notifyRef.current('Changes in another tab could not be read.');
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
  return {
    matrix: state.present,
    change: (update: (m: Matrix) => Matrix, message: string) => {
      const next = matrixSchema.parse(update(current.current));
      current.current = next;
      dispatch({ type: 'change', update: () => next });
      notify(message, true);
    },
    undo: () => dispatch({ type: 'undo' }),
    canUndo: !!state.previous,
    storageError: state.error,
  };
}
