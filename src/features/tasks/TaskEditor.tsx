import { DueDateInput } from './DueDateInput';
import { SubtasksEditor } from './SubtasksEditor';
import { newId } from '../../lib/id';
import { SoftPresence } from '../../components/SoftPresence';
import { Select, SelectOption } from '../../components/Select';
import { useState } from 'react';
import type { Task, Matrix, Labels, QuadrantId } from '../../domain/models';
import { taskSchema, categories, quadrants } from '../../domain/models';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import { localDate } from '../../domain/matrix';
import { ProjectsDialog } from '../projects/ProjectsDialog';
// Save stays disabled until the title has this many non-space characters.
const MIN_TITLE_LENGTH = 2;
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
      <Modal
        id="taskDialog"
        title={task ? 'Edit task' : 'New task'}
        kicker={task ? 'edit task' : 'new task'}
        heading={
          <mark className="hl" data-q={draft.q}>
            {draft.title.trim() || 'What’s on your mind?'}
          </mark>
        }
        onClose={onClose}
      >
        <form
          id="taskForm"
          onSubmit={(e) => {
            e.preventDefault();
            const result = taskSchema.safeParse({
              ...draft,
              subtasks: (draft.subtasks ?? []).filter((item) => item.title.trim()),
            });
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
            <span className="field-label">
              Notes <small>optional</small>
            </span>
            <textarea
              maxLength={3000}
              placeholder="A first step, a link, anything helpful…"
              value={draft.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>
          <fieldset className="quadrant-picker">
            <legend>Where does it belong?</legend>
            <div className="quadrant-tiles">
              {quadrants.map((item) => (
                <label
                  key={item.id}
                  className="quadrant-tile"
                  data-q={item.id}
                  title={item.subtitle}
                >
                  <input
                    type="radio"
                    name="taskQuadrant"
                    value={item.id}
                    checked={draft.q === item.id}
                    onChange={() => patch('q', item.id)}
                  />
                  <span className="swatch" aria-hidden="true" />
                  {labels[item.id].title}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="editor-grid">
            <label className="field">
              <span className="field-label">
                Category <small>optional</small>
              </span>
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
            <div className="field">
              <span className="field-label">
                Project
                <button type="button" className="pen-link" onClick={() => setProjects(true)}>
                  Manage projects
                </button>
              </span>
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
            </div>
            <div className="field due-field">
              <label htmlFor="taskDue" className="field-label">
                Due date <small>optional</small>
              </label>
              <DueDateInput value={draft.due} onChange={(value) => patch('due', value)} />
            </div>
          </div>
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
          <SubtasksEditor
            value={draft.subtasks ?? []}
            onChange={(value) => patch('subtasks', value)}
          />
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
                <Icon name="eliminate" /> Delete
              </button>
            )}
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={draft.title.trim().length < MIN_TITLE_LENGTH}>
              Save task
            </button>
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
