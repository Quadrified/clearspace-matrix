import { useLayoutEffect, useRef, useState } from 'react';
import type { Task, Matrix, Labels, Filters, QuadrantId } from '../../domain/models';
import { quadrants } from '../../domain/models';
import { visibleTasks, localDate } from '../../domain/matrix';
import { Icon } from '../../components/Icon';
import { EmptyIllustration } from '../../components/EmptyIllustration';
export function MatrixBoard({
  matrix,
  labels,
  filters,
  onAdd,
  onEdit,
  onLabels,
  onToggle,
  onMove,
}: {
  matrix: Matrix;
  labels: Labels;
  filters: Filters;
  onAdd: (q: QuadrantId) => void;
  onEdit: (t: Task) => void;
  onLabels: () => void;
  onToggle: (id: string) => void;
  onMove: (id: string, q: QuadrantId, before?: string) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const positions = useRef<Map<string, DOMRect> | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<{ q: QuadrantId; before?: string } | null>(null);
  function finishDrag() {
    setDragged(null);
    setTarget(null);
  }
  function drop(id: string, q: QuadrantId, before?: string) {
    finishDrag();
    if (!matrix.tasks.some((task) => task.id === id) || id === before) return;
    positions.current = new Map(
      Array.from(board.current?.querySelectorAll<HTMLElement>('[data-task-id]') ?? []).map((el) => [
        el.dataset.taskId!,
        el.getBoundingClientRect(),
      ]),
    );
    onMove(id, q, before);
  }
  useLayoutEffect(() => {
    const previous = positions.current;
    positions.current = null;
    if (!previous || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (const el of board.current?.querySelectorAll<HTMLElement>('[data-task-id]') ?? []) {
      const from = previous.get(el.dataset.taskId!);
      if (!from || !el.animate) continue;
      const to = el.getBoundingClientRect();
      const x = from.left - to.left,
        y = from.top - to.top;
      if (x || y)
        el.animate(
          [
            { transform: `translate(${x}px, ${y}px)`, opacity: 0.65 },
            { transform: 'translate(0, 0)', opacity: 1 },
          ],
          { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
    }
  }, [matrix]);
  return (
    <div className="matrix-shell" ref={board}>
      <div className="axis-top" aria-hidden="true">
        <span>Urgent</span>
        <span>Not urgent</span>
      </div>
      <div className="matrix" id="matrix">
        {quadrants.map((q) => {
          const tasks = visibleTasks(matrix, q.id, filters),
            label = labels[q.id];
          return (
            <section
              key={q.id}
              className={`quad${target?.q === q.id ? ' dragover' : ''}`}
              data-q={q.id}
              aria-label={`${label.title}, ${q.subtitle}`}
              onDragOver={(e) => {
                if (dragged) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setTarget({ q: q.id });
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setTarget(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(e.dataTransfer.getData('text/plain'), q.id);
              }}
            >
              <span className="axis-side" aria-hidden="true">
                {q.id === 'do' || q.id === 'schedule' ? 'Important' : 'Not important'}
              </span>
              <div className="qhead">
                <span className="qicon">
                  <Icon name={label.icon ?? q.id} />
                </span>
                <div>
                  <h2>{label.title}</h2>
                  <p>{label.subtitle}</p>
                </div>
                <button
                  className="iconbtn label-edit"
                  aria-label={`Edit ${label.title} title and subtitle`}
                  onClick={onLabels}
                >
                  <Icon name="edit" />
                </button>
                <span className="count" aria-label={`${tasks.length} tasks`}>
                  {tasks.length}
                </span>
              </div>
              <div className="tasklist">
                {tasks.length ? (
                  tasks.map((task) => (
                    <article
                      key={task.id}
                      data-task-id={task.id}
                      className={`task${task.done ? ' done' : ''}${dragged === task.id ? ' is-dragging' : ''}${target?.before === task.id ? ' drop-before' : ''}`}
                      draggable={filters.sort === 'manual'}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragged(task.id);
                      }}
                      onDragEnd={finishDrag}
                      onDragOver={(e) => {
                        if (dragged) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          setTarget({ q: q.id, before: task.id });
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        drop(e.dataTransfer.getData('text/plain'), q.id, task.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="check"
                        checked={task.done}
                        aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`}
                        onChange={() => onToggle(task.id)}
                      />
                      <button
                        className="task-main"
                        aria-label={`Edit ${task.title}`}
                        onClick={() => onEdit(task)}
                      >
                        <span className="task-title">{task.title}</span>
                        {task.notes.trim() && <span className="task-notes">{task.notes}</span>}

                        <span className="meta">
                          {task.isDevSample && <span className="tag">Dev</span>}
                          {task.category && <span className="tag">{task.category}</span>}
                          {task.projectId && (
                            <span className="tag project-tag">
                              {matrix.projects.find((p) => p.id === task.projectId)?.name}
                            </span>
                          )}
                          {task.due && (
                            <span
                              className={`duedate${task.due < localDate() && !task.done ? ' overdue' : ''}`}
                            >
                              {task.due < localDate() && !task.done ? 'Overdue · ' : ''}
                              {task.due === localDate()
                                ? 'Today'
                                : new Date(task.due + 'T12:00:00').toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                            </span>
                          )}
                        </span>
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty">
                    <EmptyIllustration q={q.id} />
                    <strong>
                      {filters.search || filters.category || filters.project
                        ? 'No matching tasks.'
                        : filters.status === 'done'
                          ? 'Nothing completed here yet.'
                          : filters.status === 'active' && matrix.tasks.some((t) => t.q === q.id)
                            ? 'All clear here.'
                            : q.empty}
                    </strong>
                  </div>
                )}
              </div>
              <button
                className="task-fab"
                aria-label={`Add a task to ${label.title}`}
                title={`Add a task to ${label.title}`}
                onClick={() => onAdd(q.id)}
              >
                <Icon name="plus" />
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
