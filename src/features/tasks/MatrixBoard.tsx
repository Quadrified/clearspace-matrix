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
  return (
    <>
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
              className="quad"
              data-q={q.id}
              aria-label={label.title}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onMove(e.dataTransfer.getData('text/plain'), q.id);
              }}
            >
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
                      className={`task task-enter${task.done ? ' done' : ''}`}
                      draggable={filters.sort === 'manual'}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMove(e.dataTransfer.getData('text/plain'), q.id, task.id);
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
    </>
  );
}
