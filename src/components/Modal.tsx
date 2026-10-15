import { useEffect, useRef } from 'react';
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
  const ref = useRef<HTMLDialogElement>(null);
  const outside = useRef(false);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, []);
  function isOutside(e: React.MouseEvent<HTMLDialogElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  }
  return (
    <dialog
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
    </dialog>
  );
}
