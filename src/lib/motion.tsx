import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export const softEase = [0.23, 1, 0.32, 1] as const;
export const softSpring = { type: 'spring', duration: 0.28, bounce: 0.1 } as const;
const MotionContext = createContext({ instant: import.meta.env.MODE === 'test' });

export function MotionProvider({ children }: { children: ReactNode }) {
  const [keyboard, setKeyboard] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const preference = () => setReduced(media?.matches ?? false);
    const key = () => {
      setKeyboard(true);
      document.body.classList.add('keyboard-input');
    };
    const pointer = () => {
      setKeyboard(false);
      document.body.classList.remove('keyboard-input');
    };
    media?.addEventListener?.('change', preference);
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', pointer, true);
    return () => {
      media?.removeEventListener?.('change', preference);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('pointerdown', pointer, true);
      document.body.classList.remove('keyboard-input');
    };
  }, []);
  return (
    <MotionContext.Provider value={{ instant: reduced || keyboard }}>
      {children}
    </MotionContext.Provider>
  );
}
export const useMotionSettings = () => useContext(MotionContext);
