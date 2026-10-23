import { useEffect, useRef } from 'react';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../state/storage';

/** Opens the Getting Started tutorial shortly after a first visit, unless a dialog is already open. */
export function useFirstVisitTutorial(open: () => void) {
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    // Blocked storage counts as seen, so the tutorial never reopens on every visit.
    if (readStorage(STORAGE_KEYS.tutorial, 'seen')) return;
    const timer = setTimeout(() => {
      if (!document.querySelector('dialog[open]')) openRef.current();
    }, 400);
    return () => clearTimeout(timer);
  }, []);
}

/** Remembers that the tutorial was seen. It can still close when storage is unavailable. */
export function markTutorialSeen() {
  writeStorage(STORAGE_KEYS.tutorial, 'seen');
}
