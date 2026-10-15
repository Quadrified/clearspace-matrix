import { useState } from 'react';
import type { Matrix, Project } from '../../domain/models';
import { projectNameError, removeProject } from '../../domain/matrix';
import { Modal } from '../../components/Modal';

type Props = {
  matrix: Matrix;
  change: (fn: (m: Matrix) => Matrix, message: string) => void;
  onClose: () => void;
  onCreated?: (id: string) => void;
  onDeleted?: (id: string) => void;
};
function ProjectRow({
  project,
  onRename,
  onDelete,
}: {
  project: Project;
  onRename: (name: string) => string;
  onDelete: () => void;
}) {
  const [name, setName] = useState(project.name),
    [error, setError] = useState('');
  return (
    <div className="project-row">
      <input
        aria-label={`Project name: ${project.name}`}
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn" onClick={() => setError(onRename(name))}>
        Save
      </button>
      <button className="iconbtn danger" aria-label={`Delete ${project.name}`} onClick={onDelete}>
        Delete
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function ProjectsDialog({ matrix, change, onClose, onCreated, onDeleted }: Props) {
  const [name, setName] = useState(''),
    [error, setError] = useState('');
  const [pending, setPending] = useState<Project | null>(null);
  const affected = pending ? matrix.tasks.filter((task) => task.projectId === pending.id) : [];
  const examples = [...affected].sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 2);
  const taskCount = `${affected.length} ${affected.length === 1 ? 'task' : 'tasks'}`;
  return (
    <>
      <Modal id="projectsDialog" title="A place for your projects." onClose={onClose}>
        <p className="quiet">Group related tasks. Rename projects anytime.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const problem = projectNameError(matrix, name);
            setError(problem);
            if (problem) return;
            const id = crypto.randomUUID();
            change(
              (m) => ({ ...m, projects: [...m.projects, { id, name: name.trim() }] }),
              'Project added.',
            );
            setName('');
            onCreated?.(id);
          }}
        >
          <label className="field">
            New project
            <input
              autoFocus
              maxLength={80}
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className="btn primary">Add project</button>
          {error && <p role="alert">{error}</p>}
        </form>
        <div style={{ marginTop: 20 }}>
          {matrix.projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
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
      {pending && (
        <Modal
          id="deleteProjectDialog"
          title="Delete this project?"
          onClose={() => setPending(null)}
        >
          <p className="project-delete-summary">
            <strong>{pending.name}</strong> contains <strong>{taskCount}</strong>.
            {affected.length
              ? ' Deleting this project will also delete all of these tasks, including completed tasks.'
              : ' This project has no tasks to delete.'}
          </p>
          {examples.length > 0 && (
            <>
              <p className="quiet">Tasks that will be deleted include:</p>
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
            </>
          )}
          <p className="quiet">You can undo this deletion.</p>
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
              {affected.length ? `Delete project and ${taskCount}` : 'Delete project'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
