import type { stats } from '../../domain/matrix';
import { Icon } from '../../components/Icon';

export function TaskOverview({ summary }: { summary: ReturnType<typeof stats> }) {
  const total = summary.active + summary.done;
  return (
    <section className="overview" aria-label="Task overview">
      <div className="overview-completion">
        <div
          className="completion-ring"
          role="progressbar"
          aria-label="Completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.percent}
          aria-valuetext={`${summary.done} of ${total} tasks completed`}
        >
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle className="ring-track" cx="32" cy="32" r="27" />
            <circle
              className="ring-fill"
              cx="32"
              cy="32"
              r="27"
              pathLength="100"
              strokeDasharray={`${summary.percent} 100`}
            />
          </svg>
          <strong>
            {summary.percent}
            <small>%</small>
          </strong>
        </div>
        <div className="completion-copy">
          <span>Completion</span>
          <small>{total ? `${summary.done} of ${total} tasks` : 'A fresh start'}</small>
        </div>
      </div>
      {(
        [
          [summary.active, 'Active tasks', 'do'],
          [summary.today, 'Due today', 'schedule'],
          [summary.done, 'Completed', 'check'],
        ] as const
      ).map(([value, label, icon]) => (
        <div className="overview-stat" key={label}>
          <span className="overview-stat-value">
            <Icon name={icon} />
            <strong>{value}</strong>
          </span>
          <span className="overview-stat-label">{label}</span>
        </div>
      ))}
    </section>
  );
}
