import type { ReactNode } from 'react';
import type { stats } from '../../domain/matrix';
import { TaskOverview } from '../tasks/TaskOverview';

/**
 * Today's date and progress sit in the top bar, next to the logo. On an empty
 * board, `start` (the first-task prompt) takes the place of the progress.
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
  const date = new Date(today + 'T12:00:00');
  return (
    <section className={hasTasks ? 'day' : 'day day-empty'} aria-labelledby="matrixTitle">
      <h1 id="matrixTitle" className="sr-only">
        Make room for what matters.
      </h1>
      <time
        className="date"
        dateTime={today}
        title={date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      >
        {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </time>
      {hasTasks ? <TaskOverview summary={summary} /> : start}
    </section>
  );
}
