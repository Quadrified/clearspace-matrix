import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { softEase, softSpring, useMotionSettings } from '../../lib/motion';

export function TaskPresence({ children }: { children: ReactNode }) {
  return import.meta.env.MODE === 'test' ? (
    children
  ) : (
    <AnimatePresence initial={false} mode="popLayout">
      {children}
    </AnimatePresence>
  );
}
export const TaskCardMotion = forwardRef<
  HTMLDivElement,
  { id: string; dragging: boolean; children: ReactNode }
>(function TaskCardMotion({ id, dragging, children }, ref) {
  const present = useIsPresent();
  const { instant } = useMotionSettings();
  return (
    <motion.div
      ref={ref}
      className="task-shell"
      layout={instant ? false : 'position'}
      layoutId={instant ? undefined : id}
      initial={false}
      transition={instant ? { duration: 0 } : softSpring}
      aria-hidden={!present || undefined}
      inert={!present || undefined}
    >
      <motion.div
        initial={instant ? false : { opacity: 0, transform: 'translateY(4px)' }}
        animate={{ opacity: dragging ? 0.4 : 1, transform: 'translateY(0)' }}
        exit={{ opacity: 0, transform: 'translateY(-4px)' }}
        transition={
          instant ? { duration: 0 } : { duration: 0.18, ease: softEase, layout: softSpring }
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
});
