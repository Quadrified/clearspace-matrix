import type { ReactNode } from 'react';
import { AxisBoard } from '../../components/AxisBoard';
import type { stats } from '../../domain/matrix';
import { TaskOverview } from '../tasks/TaskOverview';

/**
 * Today's date and progress. A side rail beside the matrix on wide screens, and a
 * single quiet line above it everywhere else, so the quadrants lead the page. On an
 * empty board, `start` (the first-task prompt) takes the place of the progress.
 */
export function DayPanel({
  today,
  summary,
  hasTasks,
  start,
}: {
  today: string;
  summary: ReturnType<typeof stats>;
  hasTasks: boolean;
  start?: ReactNode;
}) {
  return (
    <section className={hasTasks ? 'day' : 'day day-empty'} aria-labelledby="matrixTitle">
      <div className="day-heading">
        <time className="date" dateTime={today}>
          {new Date(today + 'T12:00:00').toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <AxisBoard />
        <div className="day-copy">
          <h1 id="matrixTitle">Make room for what matters.</h1>
          <p id="matrixSubtitle">Get it out of your head. Decide what deserves your time.</p>
        </div>
      </div>
      {hasTasks ? <TaskOverview summary={summary} /> : start}
    </section>
  );
}
