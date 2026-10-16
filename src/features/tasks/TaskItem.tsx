import { forwardRef, memo, useId } from 'react';
import type { DragEvent } from 'react';
import { Icon } from '../../components/Icon';
import { TaskCardMotion } from './TaskCardMotion';
import type { QuadrantId, Task } from '../../domain/models';

const dueFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export type TaskItemProps = {
  task: Task;
  q: QuadrantId;
  projectName?: string;
  today: string;
  dragging: boolean;
  dropBefore: boolean;
  draggable: boolean;
  isLastActive: boolean;
  onEdit: (task: Task) => void;
  onToggle: (id: string) => void;
  onCelebrate: (q: QuadrantId, taskId: string, animated: boolean) => void;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOverTask: (e: DragEvent, q: QuadrantId, id: string) => void;
  onDropOnTask: (e: DragEvent, q: QuadrantId, id: string) => void;
};

// Memoized so typing in search or dragging elsewhere does not re-render (or re-measure) every card.
export const TaskItem = memo(
  forwardRef<HTMLDivElement, TaskItemProps>(function TaskItem(
    {
      task,
      q,
      projectName,
      today,
      dragging,
      dropBefore,
      draggable,
      isLastActive,
      onEdit,
      onToggle,
      onCelebrate,
      onDragStart,
      onDragEnd,
      onDragOverTask,
      onDropOnTask,
    },
    ref,
  ) {
    const detailId = useId();
    const overdue = task.due < today && !task.done;
    return (
      <TaskCardMotion ref={ref} id={task.id} dragging={dragging}>
        <article
          data-task-id={task.id}
          className={`task${task.done ? ' done' : ''}${dragging ? ' is-dragging' : ''}${dropBefore ? ' drop-before' : ''}`}
          draggable={draggable}
          onDragStart={(e) => onDragStart(e, task.id)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOverTask(e, q, task.id)}
          onDrop={(e) => onDropOnTask(e, q, task.id)}
        >
          <label className="task-check-target">
            <input
              type="checkbox"
              className="check"
              checked={task.done}
              aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`}
              onChange={(event) => {
                onToggle(task.id);
                if (isLastActive) {
                  const animated =
                    event.nativeEvent instanceof MouseEvent && event.nativeEvent.detail > 0;
                  onCelebrate(q, task.id, animated);
                }
              }}
            />
          </label>
          <button
            className="task-main"
            aria-label={`Edit ${task.title}`}
            aria-describedby={`${detailId}-notes ${detailId}-meta`}
            onClick={() => onEdit(task)}
          >
            <span className="task-title">{task.title}</span>
            {task.notes.trim() && (
              <span className="task-notes" id={`${detailId}-notes`}>
                {task.notes}
              </span>
            )}

            <span className="meta" id={`${detailId}-meta`}>
              {task.isDevSample && <span className="tag">Dev</span>}
              {task.category && <span className="tag">{task.category}</span>}
              {task.projectId && <span className="tag project-tag">{projectName}</span>}
              {task.due && (
                <span className={`duedate${overdue ? ' overdue' : ''}`}>
                  {overdue && <Icon name="alert" className="overdue-icon" />}
                  {overdue ? 'Overdue · ' : ''}
                  {task.due === today
                    ? 'Today'
                    : dueFormat.format(new Date(task.due + 'T12:00:00'))}
                </span>
              )}
            </span>
          </button>
        </article>
      </TaskCardMotion>
    );
  }),
);
