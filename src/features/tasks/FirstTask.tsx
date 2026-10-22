import { Icon } from '../../components/Icon';

export function FirstTask({ onAdd, onExamples }: { onAdd: () => void; onExamples: () => void }) {
  return (
    <section className="first-task" aria-label="Get started">
      <button
        type="button"
        className="btn primary"
        aria-label="Add your first task"
        onClick={onAdd}
      >
        <Icon name="plus" />
        Add task
      </button>
      <button type="button" className="btn" aria-label="Try example tasks" onClick={onExamples}>
        <Icon name="leaf" />
        <span className="first-task-label">Examples</span>
      </button>
    </section>
  );
}
