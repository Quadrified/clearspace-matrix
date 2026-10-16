import { useState } from 'react';
import { useMotionSettings } from '../lib/motion';
import { Icon } from './Icon';

export function AddTaskFab({
  className,
  label,
  onClick,
}: {
  className: 'task-fab' | 'add-floating';
  label: string;
  onClick: () => void;
}) {
  const { instant } = useMotionSettings();
  // Decide on mount so changing input modality cannot restart the entrance.
  const [animate] = useState(() => !instant);
  return (
    <button
      type="button"
      className={`${className}${animate ? ' fab-reveal' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name="plus" />
    </button>
  );
}
