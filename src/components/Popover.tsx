import { motion, useIsPresent } from 'motion/react';
import { SoftPresence } from './SoftPresence';
import { softEase, useMotionSettings } from '../lib/motion';
import { forwardRef, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
export function Popover({
  id,
  open,
  onClose,
  className,
  children,
}: {
  id?: string;
  open: boolean;
  onClose: () => void;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const click = (e: PointerEvent) => {
      if (!ref.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        (ref.current?.parentElement?.querySelector('button') as HTMLButtonElement | null)?.focus();
      }
    };
    document.addEventListener('pointerdown', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', click);
      document.removeEventListener('keydown', key);
    };
  }, [open, onClose]);
  return (
    <SoftPresence>
      {open && (
        <PopoverSurface key="surface" ref={ref} id={id} className={className}>
          {children}
        </PopoverSurface>
      )}
    </SoftPresence>
  );
}
const PopoverSurface = forwardRef<
  HTMLDivElement,
  { id?: string; className: string; children: ReactNode }
>(function PopoverSurface({ id, className, children }, ref) {
  const present = useIsPresent();
  const { instant } = useMotionSettings();
  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      initial={instant ? false : { opacity: 0, transform: 'translateY(-4px) scale(.97)' }}
      animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
      exit={{ opacity: 0, transform: 'translateY(-4px) scale(.97)' }}
      transition={{ duration: instant ? 0 : 0.16, ease: softEase }}
      aria-hidden={!present || undefined}
      inert={!present || undefined}
    >
      {children}
    </motion.div>
  );
});
