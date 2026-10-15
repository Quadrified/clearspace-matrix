import { useId } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import type { Filters } from '../../domain/models';
import { softSpring, useMotionSettings } from '../../lib/motion';

export function StatusTabs({
  value,
  onChange,
}: {
  value: Filters['status'];
  onChange: (value: Filters['status']) => void;
}) {
  const id = useId();
  const { instant } = useMotionSettings();
  return (
    <LayoutGroup id={id}>
      <div className="tabs" role="group" aria-label="Task status">
        {(
          [
            ['active', 'Active'],
            ['done', 'Completed'],
            ['all', 'All tasks'],
          ] as const
        ).map(([status, label]) => (
          <button
            key={status}
            className={status === value ? 'active' : ''}
            aria-pressed={status === value}
            onClick={() => onChange(status)}
          >
            {value === status && (
              <motion.span
                className="tab-indicator"
                layoutId="status-highlight"
                aria-hidden="true"
                transition={instant ? { duration: 0 } : softSpring}
                style={{ borderRadius: 7 }}
              />
            )}
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
