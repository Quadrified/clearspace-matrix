import { useCallback, useEffect, useState } from 'react';
export function useToast() {
  const [toast, setToast] = useState<{ text: string; undo: boolean; id: number } | null>(null);
  const show = useCallback(
    (text: string, undo = false) => setToast({ text, undo, id: Date.now() + Math.random() }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(timeout);
  }, [toast]);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss };
}
