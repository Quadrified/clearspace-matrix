import { newId } from '../../lib/id';
import { SoftPresence } from '../../components/SoftPresence';
import { useState } from 'react';
import type { Matrix, Project } from '../../domain/models';
import { projectNameError, removeProject } from '../../domain/matrix';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';

const swatches = ['do', 'schedule', 'delegate', 'eliminate'] as const;

type Props = {
  matrix: Matrix;
  change: (fn: (m: Matrix) => Matrix, message: string) => void;
  onClose: () => void;
  onCreated?: (id: string) => void;
  onDeleted?: (id: string) => void;
};
function ProjectRow({
  project,
  index,
  count,
  onRename,
  onDelete,
}: {
  project: Project;
  index: number;
  count: number;
  onRename: (name: string) => string;
  onDelete: () => void;
}) {
  const [name, setName] = useState(project.name),
    [error, setError] = useState('');
  const hasChanges = name.trim() !== project.name;
  return (
    <div className="project-row">
      <span className="swatch" data-q={swatches[index % swatches.length]} aria-hidden="true" />
      <input
        autoCapitalize="words"
        enterKeyHint="done"
        aria-label={`Project name: ${project.name}`}
        maxLength={80}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
      />
      <span className="project-count">
        {count} {count === 1 ? 'task' : 'tasks'}
      </span>
      <button className="btn" disabled={!hasChanges} onClick={() => setError(onRename(name))}>
        Save
      </button>
      <button className="iconbtn danger" aria-label={`Delete ${project.name}`} onClick={onDelete}>
        <Icon name="eliminate" />
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function ProjectsDialog({ matrix, change, onClose, onCreated, onDeleted }: Props) {
  const [name, setName] = useState(''),
    [error, setError] = useState('');
  const canAdd = name.trim().length >= 2;
  const [pending, setPending] = useState<Project | null>(null);
  const affected = pending ? matrix.tasks.filter((task) => task.projectId === pending.id) : [];
  const examples = [...affected].sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 2);
  const taskCount = `${affected.length} ${affected.length === 1 ? 'task' : 'tasks'}`;
  return (
    <>
      <Modal
        id="projectsDialog"
        title="A place for your projects."
        kicker="projects"
        onClose={onClose}
      >
        <p className="dialog-lead">Group related tasks. Rename projects anytime.</p>
        <form
          className="project-add"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canAdd) return;
            const problem = projectNameError(matrix, name);
            setError(problem);
            if (problem) return;
            const id = newId();
            change(
              (m) => ({ ...m, projects: [...m.projects, { id, name: name.trim() }] }),
              'Project added.',
            );
            setName('');
            onCreated?.(id);
          }}
        >
          <label className="field">
            <span className="sr-only">New project</span>
            <input
              autoFocus
              autoCapitalize="words"
              enterKeyHint="done"
              maxLength={80}
              placeholder="Project name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
          </label>
          <button className="btn primary" disabled={!canAdd}>
            <Icon name="plus" /> Add project
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
        <div className="project-list">
          {matrix.projects.map((project, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              index={index}
              count={matrix.tasks.filter((task) => task.projectId === project.id).length}
              onRename={(value) => {
                const problem = projectNameError(matrix, value, project.id);
                if (!problem)
                  change(
                    (m) => ({
                      ...m,
                      projects: m.projects.map((p) =>
                        p.id === project.id ? { ...p, name: value.trim() } : p,
                      ),
                    }),
                    'Project updated.',
                  );
                return problem;
              }}
              onDelete={() => setPending(project)}
            />
          ))}
        </div>
      </Modal>
      <SoftPresence>
        {pending && (
          <Modal
            id="deleteProjectDialog"
            title="Delete this project?"
            kicker="careful"
            onClose={() => setPending(null)}
          >
            <p className="project-delete-summary">
              {affected.length ? (
                <>
                  <strong>{pending.name}</strong> contains <strong>{taskCount}</strong>. Deleting
                  this project will also delete all of these tasks, including completed tasks.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{pending.name}</strong>?
                </>
              )}
            </p>
            {examples.length > 0 && (
              <div className="sticky-note">
                <p>
                  <Icon name="alert" /> Tasks that will be deleted include:
                </p>
                <ul className="project-delete-tasks">
                  {examples.map((task) => (
                    <li key={task.id}>
                      <span>{task.title}</span>
                      {task.done && <small>Completed</small>}
                    </li>
                  ))}
                </ul>
                {affected.length > examples.length && (
                  <p className="quiet">
                    And {affected.length - examples.length} more{' '}
                    {affected.length - examples.length === 1 ? 'task' : 'tasks'}.
                  </p>
                )}
              </div>
            )}
            <p className="hand-note">You can undo this deletion.</p>
            <div className="dialog-actions">
              <button type="button" className="btn" autoFocus onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn reset-confirm"
                onClick={() => {
                  const id = pending.id;
                  change(
                    (m) => removeProject(m, id),
                    affected.length ? `Project and ${taskCount} deleted.` : 'Project deleted.',
                  );
                  setPending(null);
                  onDeleted?.(id);
                }}
              >
                <Icon name="eliminate" />
                {affected.length ? `Delete project and ${taskCount}` : 'Delete project'}
              </button>
            </div>
          </Modal>
        )}
      </SoftPresence>
    </>
  );
}
