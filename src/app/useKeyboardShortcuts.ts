import { useEffect, useRef } from 'react';

// Shortcuts stay out of the way while someone is typing or a dialog or list is open.
const TYPING_TARGETS =
  'input,select,textarea,[contenteditable=true],[role=combobox],[role=listbox]';

/** Single-key shortcuts for the board, such as N for a new task. Keys are lowercase letters. */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const latest = useRef(shortcuts);
  latest.current = shortcuts;
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        target.closest(TYPING_TARGETS) ||
        document.querySelector('dialog[open], [role=listbox]')
      )
        return;
      const action = latest.current[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
