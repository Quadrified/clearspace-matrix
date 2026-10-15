import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
export function Popover({
  open,
  onClose,
  className,
  children,
}: {
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
  return open ? (
    <div ref={ref} className={className}>
      {children}
    </div>
  ) : null;
}
