import type { ReactNode, RefObject } from 'react';
import { GitHubLink } from '../../components/GitHubLink';
import { Icon } from '../../components/Icon';
import { Popover } from '../../components/Popover';
import { ThemeToggle } from '../../components/ThemeToggle';
import type { usePreferences } from '../../lib/usePreferences';

export type Menu = 'settings' | null;

export function AppHeader({
  headerRef,
  devTools,
  prefs,
  menu,
  setMenu,
  onResetBoard,
  onLabels,
  onHelp,
  storageError,
}: {
  headerRef: RefObject<HTMLElement | null>;
  devTools: ReactNode;
  prefs: ReturnType<typeof usePreferences>;
  menu: Menu;
  setMenu: (menu: Menu) => void;
  onResetBoard: () => void;
  onLabels: () => void;
  onHelp: () => void;
  storageError: string;
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
        <div className="brand-copy">
          <span className="brand-name">clearspace</span>
          <span className="brand-tagline">your personal matrix</span>
        </div>
      </div>
      <div className="header-right">
        {devTools}
        {/* <FocusTimer tasks={matrix.tasks} notify={show} /> */}
        <ThemeToggle night={prefs.night} onToggle={prefs.toggleNight} />
        <GitHubLink />
        <div className="settings-control">
          <button
            id="settingsButton"
            className="iconbtn"
            aria-label="Settings"
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
              <button className="iconbtn danger" onClick={() => onResetBoard()}>
                <Icon name="eliminate" />
                Need a fresh start?
              </button>
            </div>
            <div className="settings-size">
              <span>Text size</span>
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
            <span id="saveState">
              {storageError ? 'Storage unavailable. Export to save.' : 'Saved on this browser'}
            </span>
          </Popover>
        </div>
      </div>
    </header>
  );
}
