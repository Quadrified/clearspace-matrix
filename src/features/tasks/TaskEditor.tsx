import { newId } from '../../lib/id';
import { SoftPresence } from '../../components/SoftPresence';
import { Select, SelectOption } from '../../components/Select';
import { useState } from 'react';
import type { Task, Matrix, Labels, QuadrantId } from '../../domain/models';
import { taskSchema, categories, quadrants } from '../../domain/models';
import { Modal } from '../../components/Modal';
import { localDate } from '../../domain/matrix';
import { ProjectsDialog } from '../projects/ProjectsDialog';
export function TaskEditor({
  task,
  q,
  matrix,
  labels,
  onClose,
  change,
}: {
  task?: Task;
  q: QuadrantId;
  matrix: Matrix;
  labels: Labels;
  onClose: () => void;
  change: (fn: (m: Matrix) => Matrix, message: string) => void;
}) {
  const [draft, setDraft] = useState<Task>(() =>
    task
      ? { ...task }
      : {
          id: newId(),
          title: '',
          q,
          done: false,
          notes: '',
          owner: '',
          category: 'Work',
          due: '',
          created: Date.now(),
          projectId: '',
        },
  );
  const [projects, setProjects] = useState(false),
    [error, setError] = useState('');
  function patch<K extends keyof Task>(key: K, value: Task[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  return (
    <>
      <Modal id="taskDialog" title={task ? 'Edit task' : 'New task'} onClose={onClose}>
        <form
          id="taskForm"
          onSubmit={(e) => {
            e.preventDefault();
            const result = taskSchema.safeParse(draft);
            if (!result.success) {
              setError(result.error.issues[0]?.message ?? 'Check the task details.');
              return;
            }
            change(
              (m) => ({
                ...m,
                tasks: task
                  ? m.tasks.map((t) => (t.id === task.id ? result.data : t))
                  : [...m.tasks, result.data],
              }),
              task ? 'Task updated.' : 'Task added.',
            );
            onClose();
          }}
        >
          <div className="field">
            <span>Project</span>
            <div className="project-picker">
              <Select
                aria-label="Project"
                value={draft.projectId ?? ''}
                onValueChange={(value) => patch('projectId', value)}
              >
                <SelectOption value="">No project</SelectOption>
                {matrix.projects.map((p) => (
                  <SelectOption key={p.id} value={p.id}>
                    {p.name}
                  </SelectOption>
                ))}
              </Select>
              <button type="button" className="btn" onClick={() => setProjects(true)}>
                Manage projects
              </button>
            </div>
          </div>
          <label className="field">
            Task
            <input
              autoFocus
              autoCapitalize="sentences"
              enterKeyHint="done"
              required
              maxLength={200}
              placeholder="What do you need to do?"
              value={draft.title}
              onChange={(e) => patch('title', e.target.value)}
            />
          </label>
          <label className="field">
            Where does it belong?
            <Select
              aria-label="Where does it belong?"
              value={draft.q}
              onValueChange={(value) => patch('q', value as QuadrantId)}
            >
              {quadrants.map((q) => (
                <SelectOption key={q.id} value={q.id}>
                  {labels[q.id].title} · {q.subtitle}
                </SelectOption>
              ))}
            </Select>
          </label>
          <div className="row">
            <div className="field due-field">
              <label htmlFor="taskDue">
                Due date <small>(optional)</small>
              </label>
              <input
                id="taskDue"
                type="date"
                value={draft.due}
                onChange={(e) => patch('due', e.target.value)}
              />
              <div className="date-chips" role="group" aria-label="Pick a day">
                {(
                  [
                    ['Today', 0],
                    ['Tomorrow', 1],
                    ['Next week', 7],
                  ] as const
                ).map(([label, days]) => (
                  <button
                    key={label}
                    type="button"
                    className="chip"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      patch('due', localDate(date));
                    }}
                  >
                    {label}
                  </button>
                ))}
                {draft.due && (
                  <button type="button" className="chip" onClick={() => patch('due', '')}>
                    No date
                  </button>
                )}
              </div>
            </div>
            <label className="field">
              Category <small>(optional)</small>
              <Select
                aria-label="Category"
                value={draft.category}
                onValueChange={(value) => patch('category', value as Task['category'])}
              >
                <SelectOption value="">No category</SelectOption>
                {categories.map((c) => (
                  <SelectOption key={c}>{c}</SelectOption>
                ))}
              </Select>
            </label>
          </div>
          <label className="field">
            <span>
              Notes <small>(optional)</small>
            </span>
            <textarea
              maxLength={3000}
              placeholder="A first step, a link, anything helpful…"
              value={draft.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            {task && (
              <button
                type="button"
                className="btn danger ghost push-left"
                onClick={() => {
                  change(
                    (m) => ({ ...m, tasks: m.tasks.filter((t) => t.id !== task.id) }),
                    'Task deleted.',
                  );
                  onClose();
                }}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary">Save task</button>
          </div>
        </form>
      </Modal>
      <SoftPresence>
        {projects && (
          <ProjectsDialog
            matrix={matrix}
            change={change}
            onClose={() => setProjects(false)}
            onDeleted={(id) => {
              if (task?.projectId === id) onClose();
              else if (draft.projectId === id) patch('projectId', '');
            }}
            onCreated={(id) => {
              patch('projectId', id);
              setProjects(false);
            }}
          />
        )}
      </SoftPresence>
    </>
  );
}
