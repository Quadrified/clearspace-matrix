import { useId, useRef, useState } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { TaskCardMotion, TaskPresence } from './TaskCardMotion';
import { softEase, useMotionSettings } from '../../lib/motion';
import type { Task, Matrix, Labels, Filters, QuadrantId } from '../../domain/models';
import { quadrants } from '../../domain/models';
import { visibleTasks, localDate } from '../../domain/matrix';
import { Icon } from '../../components/Icon';
import { QuadrantCelebration } from './QuadrantCelebration';
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
  const [celebrations, setCelebrations] = useState<
    Partial<Record<QuadrantId, { taskId: string; sequence: number; animated: boolean }>>
  >({});
  const celebrationSequence = useRef(0);
  const boardId = useId();
  const { instant } = useMotionSettings();
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<{ q: QuadrantId; before?: string } | null>(null);
  function finishDrag() {
    setDragged(null);
    setTarget(null);
  }
  function drop(id: string, q: QuadrantId, before?: string) {
    finishDrag();
    if (!matrix.tasks.some((task) => task.id === id) || id === before) return;
    onMove(id, q, before);
  }
  return (
    <LayoutGroup id={boardId}>
      <div className="matrix-shell">
        <div className="axis-top" aria-hidden="true">
          <span>Urgent</span>
          <span>Not urgent</span>
        </div>
        <div className="matrix" id="matrix">
          {quadrants.map((q) => {
            const tasks = visibleTasks(matrix, q.id, filters),
              label = labels[q.id];
            const celebration = celebrations[q.id];
            const cleared =
              celebration &&
              !matrix.tasks.some((t) => t.q === q.id && !t.done) &&
              matrix.tasks.some((t) => t.id === celebration.taskId && t.q === q.id && t.done);
            return (
              <motion.section
                layout={instant ? false : 'position'}
                transition={{ duration: instant ? 0 : 0.24, ease: softEase }}
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
                  <TaskPresence>
                    {tasks.length ? (
                      tasks.map((task) => (
                        <TaskCardMotion key={task.id} id={task.id} dragging={dragged === task.id}>
                          <article
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
                              onChange={(event) => {
                                const isLastActive =
                                  !task.done &&
                                  matrix.tasks.filter((t) => t.q === q.id && !t.done).length === 1;
                                onToggle(task.id);
                                if (isLastActive) {
                                  const animated =
                                    event.nativeEvent instanceof MouseEvent &&
                                    event.nativeEvent.detail > 0;
                                  const sequence = ++celebrationSequence.current;
                                  setCelebrations((current) => ({
                                    ...current,
                                    [q.id]: {
                                      taskId: task.id,
                                      sequence,
                                      animated,
                                    },
                                  }));
                                }
                              }}
                            />
                            <button
                              className="task-main"
                              aria-label={`Edit ${task.title}`}
                              onClick={() => onEdit(task)}
                            >
                              <span className="task-title">{task.title}</span>
                              {task.notes.trim() && (
                                <span className="task-notes">{task.notes}</span>
                              )}

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
                                      : new Date(task.due + 'T12:00:00').toLocaleDateString(
                                          undefined,
                                          {
                                            month: 'short',
                                            day: 'numeric',
                                          },
                                        )}
                                  </span>
                                )}
                              </span>
                            </button>
                          </article>
                        </TaskCardMotion>
                      ))
                    ) : (
                      <motion.div
                        key="empty"
                        className="empty"
                        initial={instant ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: instant ? 0 : 0.16, ease: softEase }}
                      >
                        <EmptyIllustration q={q.id} />
                        <strong>
                          {filters.search || filters.category || filters.project
                            ? 'No matching tasks.'
                            : filters.status === 'done'
                              ? 'Nothing completed here yet.'
                              : filters.status === 'active' &&
                                  matrix.tasks.some((t) => t.q === q.id)
                                ? 'All clear here.'
                                : q.empty}
                        </strong>
                      </motion.div>
                    )}
                  </TaskPresence>
                </div>
                {cleared && (
                  <QuadrantCelebration
                    key={celebration.sequence}
                    title={label.title}
                    animated={celebration.animated}
                  />
                )}
                <button
                  className="task-fab"
                  aria-label={`Add a task to ${label.title}`}
                  title={`Add a task to ${label.title}`}
                  onClick={() => onAdd(q.id)}
                >
                  <Icon name="plus" />
                </button>
              </motion.section>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}
