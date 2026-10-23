import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { TaskPresence } from './TaskCardMotion';
import { TaskItem } from './TaskItem';
import { softEase, useMotionSettings } from '../../lib/motion';
import type { Task, Matrix, Labels, Filters, QuadrantId } from '../../domain/models';
import { quadrants } from '../../domain/models';
import { visibleTasks } from '../../domain/queries';
import { Icon } from '../../components/Icon';
import { AddTaskFab } from '../../components/AddTaskFab';
import { QuadrantCelebration } from './QuadrantCelebration';
import { EmptyIllustration } from '../../components/EmptyIllustration';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../state/storage';

/** Builds the tilted, lifted copy of the card that follows the pointer; the first drag also carries a "where to" note. */
function liftCard(card: HTMLElement) {
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
  // Blocked storage counts as "seen": the hint is only a nicety.
  const firstDrag = !readStorage(STORAGE_KEYS.dragHint, 'seen');
  if (firstDrag) writeStorage(STORAGE_KEYS.dragHint, 'seen');
  if (firstDrag) {
    const note = document.createElement('span');
    note.className = 'drag-hint';
    note.textContent = 'drag it to another quadrant';
    ghost.append(note);
  }
  document.body.append(ghost);
  return ghost;
}

/** Swallows the click that the browser fires after a drag ends on the card. */
function swallowNextClick() {
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', stop, true), 0);
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
  // Mirror `dragged` and `target` so drag handlers stay stable and cards can stay memoized mid-drag.
  const draggedRef = useRef<string | null>(null);
  const targetRef = useRef<{ q: QuadrantId; before?: string } | null>(null);
  const endDragRef = useRef<(() => void) | null>(null);
  const taskIds = useMemo(() => new Set(matrix.tasks.map((task) => task.id)), [matrix.tasks]);
  const finishDrag = useCallback(() => {
    draggedRef.current = null;
    targetRef.current = null;
    setDragged(null);
    setTarget(null);
  }, []);
  const aim = useCallback((q: QuadrantId | null, before?: string) => {
    // Pointer moves fire many times a second; only re-render when the drop point really changes.
    const t = targetRef.current;
    if (t ? t.q === q && t.before === before : q === null) return;
    targetRef.current = q ? { q, before } : null;
    setTarget(targetRef.current);
  }, []);
  const drop = useCallback(
    (id: string, q: QuadrantId, before?: string) => {
      finishDrag();
      if (!taskIds.has(id) || id === before) return;
      onMove(id, q, before);
    },
    [finishDrag, onMove, taskIds],
  );
  const dropRef = useRef(drop);
  dropRef.current = drop;
  // Cards are dragged with pointer events rather than native drag and drop, so the page keeps
  // its own cursor throughout. Touch is left alone: phones move tasks from the editor.
  const onPointerDownTask = useCallback(
    (e: ReactPointerEvent<HTMLElement>, id: string) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if ((e.target as Element).closest('input, label, .card-subtasks')) return;
      const card = e.currentTarget;
      const startX = e.clientX,
        startY = e.clientY;
      let ghost: HTMLElement | null = null;
      let offsetX = 0,
        offsetY = 0;
      const move = (ev: PointerEvent) => {
        if (!ghost) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
          const box = card.getBoundingClientRect();
          // The ghost has 14px of padding around the card.
          offsetX = startX - box.left + 14;
          offsetY = startY - box.top + 14;
          ghost = liftCard(card);
          document.documentElement.classList.add('card-dragging');
          // The press may have started a text selection; a drag should not leave one behind.
          window.getSelection()?.removeAllRanges();
          draggedRef.current = id;
          setDragged(id);
        }
        ghost.style.transform = `translate(${ev.clientX - offsetX}px, ${ev.clientY - offsetY}px)`;
        const hit = document.elementFromPoint(ev.clientX, ev.clientY);
        const quad = hit?.closest<HTMLElement>('.quad[data-q]');
        const over = hit?.closest<HTMLElement>('[data-task-id]');
        aim(
          (quad?.dataset.q as QuadrantId | undefined) ?? null,
          over && quad?.contains(over) ? over.dataset.taskId : undefined,
        );
      };
      const end = (commit: boolean) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
        endDragRef.current = null;
        if (!ghost) return;
        ghost.remove();
        document.documentElement.classList.remove('card-dragging');
        swallowNextClick();
        const t = targetRef.current;
        if (commit && t) dropRef.current(id, t.q, t.before);
        else finishDrag();
      };
      const onUp = () => end(true);
      const onCancel = () => end(false);
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') end(false);
      };
      endDragRef.current?.();
      endDragRef.current = onCancel;
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey);
    },
    [aim, finishDrag],
  );
  useEffect(() => () => endDragRef.current?.(), []);
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
                          onPointerDown={onPointerDownTask}
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
