import { useCallback, useEffect, useState } from 'react';
/** `hold` keeps the current toast from timing out, e.g. while a dialog covers it. */
export function useToast(hold = false) {
  const [toast, setToast] = useState<{ text: string; undo: boolean; id: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const show = useCallback(
    (text: string, undo = false) => setToast({ text, undo, id: Date.now() + Math.random() }),
    [],
  );
  useEffect(() => {
    if (!toast || paused || hold) return;
    const timeout = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(timeout);
  }, [toast, paused, hold]);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss, setPaused };
}
