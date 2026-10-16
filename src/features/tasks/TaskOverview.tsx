import type { stats } from '../../domain/matrix';

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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle className="ring-track" cx="12" cy="12" r="9.5" />
            <circle
              className="ring-fill"
              cx="12"
              cy="12"
              r="9.5"
              pathLength="100"
              strokeDasharray={`${summary.percent} 100`}
            />
          </svg>
        </div>
        <div className="completion-copy">
          <span>
            <strong>{summary.percent}%</strong> done
          </span>
          <small>{total ? `${summary.done} of ${total} tasks` : 'A fresh start'}</small>
        </div>
      </div>
      {(
        [
          [summary.active, 'Active'],
          [summary.today, 'Due today'],
          [summary.done, 'Completed'],
        ] as const
      ).map(([value, label]) => (
        <div className="overview-stat" key={label}>
          <strong>{value}</strong>
          <span className="overview-stat-label">{label}</span>
        </div>
      ))}
    </section>
  );
}
