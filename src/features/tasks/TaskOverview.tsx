import type { stats } from '../../domain/matrix';

/** One quiet progress figure. The status tabs already carry the active and completed counts. */
export function TaskOverview({ summary }: { summary: ReturnType<typeof stats> }) {
  const total = summary.active + summary.done;
  const detail = `${summary.done} of ${total} tasks completed`;
  return (
    <section className="overview" aria-label="Task overview" title={detail}>
      <div
        className="completion-ring"
        role="progressbar"
        aria-label="Completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.percent}
        aria-valuetext={detail}
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
      <span className="completion-copy">
        <strong>{summary.percent}%</strong>
        <span className="completion-word"> done</span>
      </span>
    </section>
  );
}
