import { Icon } from '../../components/Icon';

export function FirstTask({ onAdd, onExamples }: { onAdd: () => void; onExamples: () => void }) {
  return (
    <section className="first-task" aria-label="Get started">
      <div>
        <h2>Write down the first thing on your mind, or explore a few examples.</h2>
      </div>
      <div className="first-task-actions">
        <button type="button" className="btn primary" onClick={onAdd}>
          <Icon name="plus" />
          Add your first task
        </button>
        <button type="button" className="btn" onClick={onExamples}>
          Try example tasks
        </button>
      </div>
    </section>
  );
}
