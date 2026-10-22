import { useRef } from 'react';
import { Icon } from '../../components/Icon';
import type { Subtask } from '../../domain/models';
import { newId } from '../../lib/id';

export function SubtasksEditor({
  value,
  onChange,
}: {
  value: Subtask[];
  onChange: (value: Subtask[]) => void;
}) {
  const focusNext = useRef<string | null>(null);
  function add() {
    if (value.length >= 100) return;
    const id = newId();
    focusNext.current = id;
    onChange([...value, { id, title: '', done: false }]);
  }
  function update(id: string, patch: Partial<Subtask>) {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  return (
    <fieldset className="subtasks-editor">
      <legend>
        Subtasks <small>optional</small>
      </legend>
      {value.length > 0 && (
        <p className="subtasks-tally">
          {value.filter((item) => item.done).length} of {value.length} done
        </p>
      )}
      <p className="hint">Break it into smaller steps. Empty steps are skipped when you save.</p>
      <ol>
        {value.map((item, index) => (
          <li key={item.id}>
            <label className="subtask-check-target">
              <input
                type="checkbox"
                className="check"
                aria-label={`Subtask ${index + 1} complete`}
                checked={item.done}
                onChange={() => update(item.id, { done: !item.done })}
              />
            </label>
            <input
              ref={(node) => {
                if (node && focusNext.current === item.id) {
                  node.focus();
                  focusNext.current = null;
                }
              }}
              aria-label={`Subtask ${index + 1}`}
              value={item.title}
              maxLength={200}
              placeholder="A smaller step…"
              autoCapitalize="sentences"
              enterKeyHint="next"
              onChange={(event) => update(item.id, { title: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (item.title.trim()) add();
                }
              }}
            />
            <button
              type="button"
              className="iconbtn"
              aria-label={`Remove subtask ${index + 1}`}
              onClick={() => onChange(value.filter((entry) => entry.id !== item.id))}
            >
              <Icon name="close" />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="add-step" onClick={add} disabled={value.length >= 100}>
        <span className="add-step-box" aria-hidden="true">
          <Icon name="plus" />
        </span>
        Add subtask
      </button>
      {value.length >= 100 && <p className="hint">Up to 100 subtasks per task.</p>}
    </fieldset>
  );
}
