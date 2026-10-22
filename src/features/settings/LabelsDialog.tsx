import { useState } from 'react';
import { defaultLabels, iconNames, quadrants, labelsSchema } from '../../domain/models';
import type { Labels, QuadrantId } from '../../domain/models';
import { Modal } from '../../components/Modal';
import { Icon, iconLabels } from '../../components/Icon';
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
    <Modal id="labelsDialog" title="Make this matrix yours." kicker="labels" onClose={onClose}>
      <p className="dialog-lead">Customize the quadrant labels and icons.</p>
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
            <div className="label-section" key={q.id} role="group" aria-label={q.subtitle}>
              <button
                type="button"
                className="icon-picker-trigger"
                data-q={q.id}
                aria-label={`Choose icon for ${draft[q.id].title || q.subtitle}`}
                aria-expanded={picker === q.id}
                onClick={() => setPicker(picker === q.id ? null : q.id)}
              >
                <Icon name={draft[q.id].icon ?? q.id} />
              </button>
              <label className="field">
                <span className="sr-only">Title</span>
                <input
                  required
                  maxLength={60}
                  value={draft[q.id].title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [q.id]: { ...d[q.id], title: e.target.value } }))
                  }
                />
              </label>
              <label className="field">
                <span className="sr-only">Subtitle</span>
                <input
                  maxLength={180}
                  placeholder={q.subtitle}
                  value={draft[q.id].subtitle}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [q.id]: { ...d[q.id], subtitle: e.target.value } }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
        {picker && (
          <div className="icon-picker">
            <p className="icon-picker-label">Icon for “{draft[picker].title}”</p>
            <div
              className="icon-options"
              role="group"
              aria-label={`Icons for ${draft[picker].title}`}
            >
              {iconNames.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  className="icon-choice"
                  aria-label={iconLabels[icon]}
                  title={iconLabels[icon]}
                  aria-pressed={draft[picker].icon === icon}
                  onClick={() => {
                    setDraft((d) => ({ ...d, [picker]: { ...d[picker], icon } }));
                    setPicker(null);
                  }}
                >
                  <Icon name={icon} />
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <button
            type="button"
            className="pen-link push-left"
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
