import { motion, useIsPresent } from 'motion/react';
import { Icon } from './Icon';
import { softEase, useMotionSettings } from '../lib/motion';

export function Toast({
  text,
  undo,
  onUndo,
  onDismiss,
  onPause,
}: {
  text: string;
  undo: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  onPause?: (paused: boolean) => void;
}) {
  const present = useIsPresent();
  const { instant } = useMotionSettings();
  return (
    <motion.div
      id="toast"
      className="toast"
      role="status"
      onPointerEnter={() => onPause?.(true)}
      onPointerLeave={() => onPause?.(false)}
      onFocus={() => onPause?.(true)}
      onBlur={() => onPause?.(false)}
      aria-hidden={!present || undefined}
      inert={!present || undefined}
      initial={instant ? false : { opacity: 0, transform: 'translate(-50%, 6px)' }}
      animate={{ opacity: 1, transform: 'translate(-50%, 0)' }}
      exit={{ opacity: 0, transform: 'translate(-50%, 6px)' }}
      transition={{ duration: instant ? 0 : 0.18, ease: softEase }}
    >
      <span>{text}</span>
      {undo && (
        <button type="button" id="undo" onClick={onUndo}>
          Undo
        </button>
      )}
      <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>
        <Icon name="close" />
      </button>
    </motion.div>
  );
}
