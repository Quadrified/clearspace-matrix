import { useId } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import type { Filters } from '../../domain/models';
import { softSpring, useMotionSettings } from '../../lib/motion';

export function StatusTabs({
  value,
  counts,
  onChange,
}: {
  value: Filters['status'];
  counts: { active: number; done: number; all: number };
  onChange: (value: Filters['status']) => void;
}) {
  const id = useId();
  const { instant } = useMotionSettings();
  return (
    <LayoutGroup id={id}>
      <div className="tabs" role="group" aria-label="Task status">
        {(
          [
            ['active', 'Active', counts.active],
            ['done', 'Completed', counts.done],
            ['all', 'All tasks', counts.all],
          ] as const
        ).map(([status, label, count]) => (
          <button
            key={status}
            className={status === value ? 'active' : ''}
            aria-pressed={status === value}
            aria-describedby={`${id}-${status}`}
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
            <span className="tab-count" id={`${id}-${status}`} aria-hidden="true">
              {count}
            </span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
