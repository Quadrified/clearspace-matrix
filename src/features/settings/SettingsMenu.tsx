import type { ReactNode } from 'react';
import { GitHubLink } from '../../components/GitHubLink';
import { Icon } from '../../components/Icon';
import { Popover } from '../../components/Popover';
import type { Preferences, ThemeChoice } from '../../state/usePreferences';

const themeChoices: [ThemeChoice, string][] = [
  ['auto', 'Auto'],
  ['light', 'Light'],
  ['night', 'Dark'],
];

/** The gear button and its menu: labels, help, appearance, text size, backups and the danger zone. */
export function SettingsMenu({
  open,
  onOpenChange,
  prefs,
  backup,
  storageError,
  onLabels,
  onHelp,
  onClearCompleted,
  onResetBoard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: Preferences;
  /** The Backups & data section. */
  backup: ReactNode;
  storageError: string;
  onLabels: () => void;
  onHelp: () => void;
  onClearCompleted: () => void;
  onResetBoard: () => void;
}) {
  return (
    <div className="settings-control">
      <button
        id="settingsButton"
        className="iconbtn tool-button"
        aria-label="Settings"
        title="Settings"
        aria-expanded={open}
        aria-controls="settingsMenu"
        onClick={() => onOpenChange(!open)}
      >
        <Icon name="settings" />
      </button>
      <Popover
        id="settingsMenu"
        open={open}
        onClose={() => onOpenChange(false)}
        className="settings-menu"
      >
        <h2>Settings</h2>
        <div className="settings-actions">
          <button className="iconbtn" onClick={() => onLabels()}>
            <Icon name="tag" />
            Edit labels
          </button>
          <button className="iconbtn" onClick={() => onHelp()}>
            <Icon name="help" />
            Help
          </button>
          <GitHubLink />
        </div>
        <div className="settings-size" role="group" aria-labelledby="themeChoiceLabel">
          <span id="themeChoiceLabel" className="settings-label">
            Appearance
          </span>
          <div className="font-controls theme-choice">
            {themeChoices.map(([value, label]) => (
              <button
                key={value}
                aria-pressed={prefs.theme === value}
                title={value === 'auto' ? 'Follow your system setting' : undefined}
                onClick={() => prefs.setTheme(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-size">
          <span className="settings-label">Text size</span>
          <div className="font-controls">
            <button
              aria-label="Decrease text size"
              disabled={prefs.size <= 90}
              onClick={() => prefs.setSize(prefs.size - 10)}
            >
              A−
            </button>
            <button aria-label="Reset text size" onClick={() => prefs.setSize(100)}>
              {prefs.size}%
            </button>
            <button
              aria-label="Increase text size"
              disabled={prefs.size >= 160}
              onClick={() => prefs.setSize(prefs.size + 10)}
            >
              A+
            </button>
          </div>
        </div>
        {backup}
        {storageError && (
          <p className="hint" role="alert">
            Storage unavailable. Export to save.
          </p>
        )}
        <section className="settings-danger" aria-labelledby="dangerZoneTitle">
          <h3 id="dangerZoneTitle">
            <Icon name="alert" /> Danger zone
          </h3>
          <div className="settings-actions">
            <button className="iconbtn danger" onClick={onClearCompleted}>
              <Icon name="eliminate" />
              Clear completed
            </button>
            <button className="iconbtn danger" onClick={onResetBoard}>
              <Icon name="reset" />
              Need a fresh start?
            </button>
          </div>
        </section>
      </Popover>
    </div>
  );
}
