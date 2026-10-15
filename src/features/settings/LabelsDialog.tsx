import { useState } from 'react';
import { defaultLabels, iconNames, quadrants, labelsSchema } from '../../domain/models';
import type { Labels, QuadrantId } from '../../domain/models';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
export function LabelsDialog({
  labels,
  onSave,
  onClose,
}: {
  labels: Labels;
  onSave: (v: Labels) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(labels)),
    [picker, setPicker] = useState<QuadrantId | null>(null),
    [error, setError] = useState('');
  return (
    <Modal id="labelsDialog" title="Make this matrix yours." onClose={onClose}>
      <p className="quiet">Customize the quadrant labels and icons.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const result = labelsSchema.safeParse(draft);
          if (!result.success) {
            setError('Give each quadrant a title.');
            return;
          }
          onSave(result.data);
          onClose();
        }}
      >
        <div id="quadrantLabels">
          {quadrants.map((q) => (
            <div className="label-section" key={q.id}>
              <h3>{q.subtitle}</h3>
              <div className="label-title-row">
                <label className="field">
                  Title
                  <input
                    required
                    maxLength={60}
                    value={draft[q.id].title}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [q.id]: { ...d[q.id], title: e.target.value } }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn icon-picker-trigger"
                  aria-expanded={picker === q.id}
                  onClick={() => setPicker(picker === q.id ? null : q.id)}
                >
                  <Icon name={draft[q.id].icon ?? q.id} />
                  Choose icon
                </button>
              </div>
              {picker === q.id && (
                <div className="icon-options" aria-label={`Icons for ${draft[q.id].title}`}>
                  {iconNames.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      className="icon-choice"
                      aria-label={icon}
                      aria-pressed={draft[q.id].icon === icon}
                      onClick={() => {
                        setDraft((d) => ({ ...d, [q.id]: { ...d[q.id], icon } }));
                        setPicker(null);
                      }}
                    >
                      <Icon name={icon} />
                    </button>
                  ))}
                </div>
              )}
              <label className="field">
                Subtitle
                <input
                  maxLength={180}
                  value={draft[q.id].subtitle}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [q.id]: { ...d[q.id], subtitle: e.target.value } }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <button
            type="button"
            className="btn"
            style={{ marginRight: 'auto' }}
            onClick={() => setDraft(structuredClone(defaultLabels))}
          >
            Use defaults
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary">Save labels</button>
        </div>
      </form>
    </Modal>
  );
}
