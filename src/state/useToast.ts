import { useCallback, useEffect, useState } from 'react';
export function useToast() {
  const [toast, setToast] = useState<{ text: string; undo: boolean; id: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const show = useCallback(
    (text: string, undo = false) => setToast({ text, undo, id: Date.now() + Math.random() }),
    [],
  );
  useEffect(() => {
    if (!toast || paused) return;
    const timeout = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(timeout);
  }, [toast, paused]);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss, setPaused };
}
