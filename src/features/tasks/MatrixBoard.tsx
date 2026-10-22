import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { TaskPresence } from './TaskCardMotion';
import { TaskItem } from './TaskItem';
import { softEase, useMotionSettings } from '../../lib/motion';
import type { Task, Matrix, Labels, Filters, QuadrantId } from '../../domain/models';
import { quadrants } from '../../domain/models';
import { visibleTasks } from '../../domain/matrix';
import { Icon } from '../../components/Icon';
import { AddTaskFab } from '../../components/AddTaskFab';
import { QuadrantCelebration } from './QuadrantCelebration';
import { EmptyIllustration } from '../../components/EmptyIllustration';
const DRAG_HINT_KEY = 'clearspace.dragHint.v1';

/** Drags a tilted, lifted copy of the card; the first drag also carries a "where to" note. */
function liftCard(e: DragEvent) {
  const card = e.currentTarget;
  if (!(card instanceof HTMLElement) || typeof e.dataTransfer.setDragImage !== 'function') return;
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const style = getComputedStyle(card);
  for (const name of ['--accent', '--tint'])
    ghost.style.setProperty(name, style.getPropertyValue(name));
  const clone = card.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  clone.classList.remove('is-dragging', 'drop-before');
  clone.style.width = `${card.offsetWidth}px`;
  ghost.append(clone);
  let firstDrag = false;
  try {
    firstDrag = !localStorage.getItem(DRAG_HINT_KEY);
    if (firstDrag) localStorage.setItem(DRAG_HINT_KEY, 'seen');
  } catch {
    // Storage can be blocked; the hint is only a nicety.
  }
  if (firstDrag) {
    const note = document.createElement('span');
    note.className = 'drag-hint';
    note.textContent = 'drag it to another quadrant';
    ghost.append(note);
  }
  document.body.append(ghost);
  const box = card.getBoundingClientRect();
  e.dataTransfer.setDragImage(ghost, e.clientX - box.left + 14, e.clientY - box.top + 14);
  setTimeout(() => ghost.remove(), 0);
}

export function MatrixBoard({
  matrix,
  labels,
  filters,
  today,
  onAdd,
  onEdit,
  onLabels,
  onToggle,
  onToggleSubtask,
  onMove,
}: {
  matrix: Matrix;
  labels: Labels;
  filters: Filters;
  today: string;
  onAdd: (q: QuadrantId) => void;
  onEdit: (t: Task) => void;
  onLabels: () => void;
  onToggle: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
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
  // Mirrors `dragged` so drag handlers stay stable and cards can stay memoized mid-drag.
  const draggedRef = useRef<string | null>(null);
  const taskIds = useMemo(() => new Set(matrix.tasks.map((task) => task.id)), [matrix.tasks]);
  const finishDrag = useCallback(() => {
    draggedRef.current = null;
    setDragged(null);
    setTarget(null);
  }, []);
  const aim = useCallback((q: QuadrantId, before?: string) => {
    // Dragover fires many times a second; only re-render when the drop point really changes.
    setTarget((t) => (t && t.q === q && t.before === before ? t : { q, before }));
  }, []);
  const drop = useCallback(
    (id: string, q: QuadrantId, before?: string) => {
      finishDrag();
      if (!taskIds.has(id) || id === before) return;
      onMove(id, q, before);
    },
    [finishDrag, onMove, taskIds],
  );
  const onDragStart = useCallback((e: DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    liftCard(e);
    draggedRef.current = id;
    setDragged(id);
  }, []);
  const onDragOverTask = useCallback(
    (e: DragEvent, q: QuadrantId, id: string) => {
      if (draggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        aim(q, id);
      }
    },
    [aim],
  );
  const onDropOnTask = useCallback(
    (e: DragEvent, q: QuadrantId, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      drop(e.dataTransfer.getData('text/plain'), q, id);
    },
    [drop],
  );
  const onCelebrate = useCallback((q: QuadrantId, taskId: string, animated: boolean) => {
    const sequence = ++celebrationSequence.current;
    setCelebrations((current) => ({ ...current, [q]: { taskId, sequence, animated } }));
  }, []);
  const projectNames = useMemo(
    () => new Map(matrix.projects.map((p) => [p.id, p.name])),
    [matrix.projects],
  );
  const columns = useMemo(
    () => quadrants.map((q) => visibleTasks(matrix, q.id, filters)),
    [matrix, filters],
  );
  const filtered = !!(filters.search || filters.category || filters.project);
  const hasTasks = (q: QuadrantId) => matrix.tasks.some((t) => t.q === q);
  const activeCount = useMemo(() => {
    const counts: Record<QuadrantId, number> = { do: 0, schedule: 0, delegate: 0, eliminate: 0 };
    for (const t of matrix.tasks) if (!t.done) counts[t.q]++;
    return counts;
  }, [matrix.tasks]);
  return (
    <LayoutGroup id={boardId}>
      <div className="matrix-shell">
        <div className="axis-top" aria-hidden="true">
          <span>Urgent</span>
          <span>Not urgent</span>
        </div>
        <div className="matrix" id="matrix">
          {quadrants.map((q, index) => {
            const tasks = columns[index]!,
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
                    aim(q.id);
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
                <div className="axis-rail" aria-hidden="true">
                  <span className="axis-side">
                    {q.id === 'do' || q.id === 'schedule' ? 'Important' : 'Not important'}
                  </span>
                </div>
                <div className="axis-mobile" aria-hidden="true">
                  {q.id === 'do' || q.id === 'delegate' ? 'Urgent' : 'Not urgent'}
                </div>
                <div className="qhead">
                  <span className="qicon">
                    <Icon name={label.icon ?? q.id} />
                  </span>
                  <div>
                    <div className="qtitle">
                      <h2>{label.title}</h2>
                      <span className="count" role="img" aria-label={`${tasks.length} tasks`}>
                        {tasks.length}
                      </span>
                    </div>
                    <p>{label.subtitle}</p>
                  </div>
                  <button
                    className="iconbtn label-edit"
                    aria-label={`Edit ${label.title} title and subtitle`}
                    onClick={onLabels}
                  >
                    <Icon name="edit" />
                  </button>
                  {/* Adding lives in the header so it never covers the last card. */}
                  {matrix.tasks.length > 0 && (
                    <AddTaskFab
                      className="task-fab"
                      label={`Add a task to ${label.title}`}
                      onClick={() => onAdd(q.id)}
                    />
                  )}
                </div>
                <motion.div
                  layoutScroll
                  className={`tasklist${tasks.length === 0 ? ' is-empty' : ''}`}
                  role="region"
                  aria-label={`Tasks in ${label.title}`}
                  tabIndex={0}
                >
                  <TaskPresence>
                    {tasks.length ? (
                      tasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          q={q.id}
                          projectName={projectNames.get(task.projectId ?? '')}
                          today={today}
                          dragging={dragged === task.id}
                          dropBefore={target?.before === task.id}
                          draggable={filters.sort === 'manual'}
                          isLastActive={!task.done && activeCount[q.id] === 1}
                          onEdit={onEdit}
                          onToggle={onToggle}
                          onToggleSubtask={onToggleSubtask}
                          onCelebrate={onCelebrate}
                          onDragStart={onDragStart}
                          onDragEnd={finishDrag}
                          onDragOverTask={onDragOverTask}
                          onDropOnTask={onDropOnTask}
                        />
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
                          {filtered
                            ? 'No matching tasks.'
                            : filters.status === 'done'
                              ? 'Nothing completed here yet.'
                              : filters.status === 'active' && hasTasks(q.id)
                                ? 'All clear here.'
                                : q.empty}
                        </strong>
                      </motion.div>
                    )}
                  </TaskPresence>
                </motion.div>
                {cleared && (
                  <QuadrantCelebration
                    key={celebration.sequence}
                    title={label.title}
                    animated={celebration.animated}
                  />
                )}
              </motion.section>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}
