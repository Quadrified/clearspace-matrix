import type { ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';

export function SoftPresence({ children }: { children: ReactNode }) {
  return import.meta.env.MODE === 'test' ? (
    children
  ) : (
    <AnimatePresence initial={false} propagate>
      {children}
    </AnimatePresence>
  );
}
