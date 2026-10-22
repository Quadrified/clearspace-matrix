import type { ReactNode, RefObject } from 'react';
import { GitHubLink } from '../../components/GitHubLink';
import { Icon } from '../../components/Icon';
import { Popover } from '../../components/Popover';
import type { ThemeChoice, usePreferences } from '../../lib/usePreferences';

const themeChoices: [ThemeChoice, string][] = [
  ['auto', 'Auto'],
  ['light', 'Light'],
  ['night', 'Dark'],
];

export type Menu = 'settings' | null;

export function AppHeader({
  headerRef,
  devTools,
  prefs,
  menu,
  setMenu,
  onResetBoard,
  onClearCompleted,
  onLabels,
  onHelp,
  storageError,
  backupSettings,
  day,
  tabs,
  tools,
}: {
  headerRef: RefObject<HTMLElement | null>;
  devTools: ReactNode;
  prefs: ReturnType<typeof usePreferences>;
  menu: Menu;
  setMenu: (menu: Menu) => void;
  onResetBoard: () => void;
  onClearCompleted: () => void;
  onLabels: () => void;
  onHelp: () => void;
  storageError: string;
  backupSettings: ReactNode;
  /** Date and progress, beside the logo. */
  day: ReactNode;
  /** Status tabs, centred. */
  tabs: ReactNode;
  /** Search, filters and projects, before Settings. */
  tools: ReactNode;
}) {
  return (
    <header ref={headerRef}>
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="sr-only">clearspace</span>
        {day}
      </div>
      <div className="header-tabs">{tabs}</div>
      <div className="header-right">
        {tools}
        {devTools}
        <div className="settings-control">
          <button
            id="settingsButton"
            className="iconbtn tool-button"
            aria-label="Settings"
            title="Settings"
            aria-expanded={menu === 'settings'}
            aria-controls="settingsMenu"
            onClick={() => setMenu(menu === 'settings' ? null : 'settings')}
          >
            <Icon name="settings" />
          </button>
          <Popover
            id="settingsMenu"
            open={menu === 'settings'}
            onClose={() => setMenu(null)}
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
            {backupSettings}
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
      </div>
    </header>
  );
}
