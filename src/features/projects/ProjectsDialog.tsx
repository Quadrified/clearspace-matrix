import { useState } from 'react';
import type { Matrix, Project } from '../../domain/models';
import { projectNameError, removeProject } from '../../domain/matrix';
import { Modal } from '../../components/Modal';
type Props = {
  matrix: Matrix;
  change: (fn: (m: Matrix) => Matrix, message: string) => void;
  onClose: () => void;
  onCreated?: (id: string) => void;
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
export function ProjectsDialog({ matrix, change, onClose, onCreated }: Props) {
  const [name, setName] = useState(''),
    [error, setError] = useState('');
  return (
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
            onDelete={() =>
              change((m) => removeProject(m, project.id), 'Project removed. Tasks kept.')
            }
          />
        ))}
      </div>
    </Modal>
  );
}
