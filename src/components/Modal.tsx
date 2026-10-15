import { createPortal } from 'react-dom';
import { motion, useIsPresent } from 'motion/react';
import { softEase, useMotionSettings } from '../lib/motion';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
export function Modal({
  id,
  title,
  onClose,
  children,
  backdropClose = false,
}: {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  backdropClose?: boolean;
}) {
  const present = useIsPresent();
  const { instant } = useMotionSettings();
  const ref = useRef<HTMLDialogElement>(null);
  const outside = useRef(false);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, []);
  useLayoutEffect(() => {
    // Release the native focus trap immediately; the inert visual can finish fading.
    if (!present && ref.current?.open) ref.current.close();
  }, [present]);
  function isOutside(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target !== e.currentTarget) return false;
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  }
  return (
    <>
      <motion.dialog
        data-closing={!present || undefined}
        initial={instant ? false : { opacity: 0, transform: 'translateY(8px) scale(.98)' }}
        animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
        exit={{ opacity: 0, transform: 'translateY(6px) scale(.98)' }}
        transition={{ duration: instant ? 0 : 0.18, ease: softEase }}
        aria-hidden={!present || undefined}
        inert={!present || undefined}
        ref={ref}
        id={id}
        aria-labelledby={`${id}-title`}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        onPointerDown={(e) => {
          outside.current = isOutside(e);
        }}
        onClick={(e) => {
          if (backdropClose && outside.current && isOutside(e)) onClose();
          outside.current = false;
        }}
      >
        <div className="dialog-top">
          <h2 id={`${id}-title`}>{title}</h2>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </motion.dialog>
      {!present &&
        createPortal(<div className="dialog-exit-backdrop" aria-hidden="true" />, document.body)}
    </>
  );
}
