import { useEffect, useRef, useState } from 'react';
import type { Filters, QuadrantId, Task } from './domain/models';
import { categories, initialFilters } from './domain/models';
import {
  addExamples,
  mergeMatrix,
  moveTask,
  parseBackup,
  serializeMatrix,
  stats,
} from './domain/matrix';
import { useToast } from './lib/useToast';
import { useMatrix } from './lib/useMatrix';
import { usePreferences } from './lib/usePreferences';
import { Icon } from './components/Icon';
import { Modal } from './components/Modal';
import { Popover } from './components/Popover';
import { MatrixBoard } from './features/tasks/MatrixBoard';
import { TaskEditor } from './features/tasks/TaskEditor';
import { ProjectsDialog } from './features/projects/ProjectsDialog';
import { LabelsDialog } from './features/settings/LabelsDialog';
import { FocusTimer } from './features/focus/FocusTimer';
import { TutorialDialog } from './features/tutorial/TutorialDialog';
import { useDev } from './features/dev/useDev';
export default function App() {
  const { toast, show, dismiss } = useToast();
  const { matrix, change, undo, canUndo, storageError } = useMatrix(show);
  const prefs = usePreferences(show),
    dev = useDev(change, show);
  const [filters, setFilters] = useState(initialFilters),
    [menu, setMenu] = useState<'add' | 'settings' | null>(null),
    [editor, setEditor] = useState<{ q: QuadrantId; task?: Task } | null>(null),
    [dialog, setDialog] = useState<'projects' | 'labels' | 'tutorial' | 'reset' | 'dev' | null>(
      null,
    );
  const importRef = useRef<HTMLInputElement>(null);
  const summary = stats(matrix);
  function openTask(q: QuadrantId = 'do', task?: Task) {
    setMenu(null);
    setEditor({ q, task });
  }
  function openDialog(value: typeof dialog) {
    setMenu(null);
    setDialog(value);
  }
  function closeTutorial() {
    try {
      localStorage.setItem('clearspace.tutorial.v1', 'seen');
    } catch {
      /* Tutorial can still close when storage is unavailable. */
    }
    setDialog(null);
  }
  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem('clearspace.tutorial.v1');
    } catch {
      seen = true;
    }
    if (seen) return;
    const timer = setTimeout(() => {
      if (!document.querySelector('dialog[open]')) setDialog('tutorial');
    }, 400);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        target.closest('input,select,textarea,[contenteditable=true]') ||
        document.querySelector('dialog[open]')
      )
        return;
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openTask();
      }
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setMenu(null);
        setDialog('projects');
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  function filter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function exportBackup() {
    const url = URL.createObjectURL(
        new Blob([serializeMatrix(matrix)], { type: 'application/json' }),
      ),
      a = document.createElement('a');
    a.href = url;
    a.download = `clearspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    show('Backup exported.');
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      const incoming = parseBackup(await file.text());
      change((m) => mergeMatrix(m, incoming), 'Backup imported.');
    } catch {
      show('This backup could not be imported. Check that it is a Clearspace JSON backup.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }
  const updateTask = (id: string) =>
    change(
      (m) => ({
        ...m,
        tasks: m.tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null } : t,
        ),
      }),
      'Task updated.',
    );
  return (
    <>
      <div className="wrap">
        <header>
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
            {dev.authorized && (
              <button className="btn" id="devButton" onClick={() => openDialog('dev')}>
                Dev
              </button>
            )}
            <FocusTimer tasks={matrix.tasks} notify={show} />
            <div className="settings-control">
              <button
                id="settingsButton"
                className="iconbtn"
                aria-label="Settings"
                aria-expanded={menu === 'settings'}
                onClick={() => setMenu(menu === 'settings' ? null : 'settings')}
              >
                <Icon name="settings" />
              </button>
              <Popover
                open={menu === 'settings'}
                onClose={() => setMenu(null)}
                className="settings-menu"
              >
                <h2>Settings</h2>
                <div className="settings-actions">
                  <button className="iconbtn" onClick={prefs.toggleNight}>
                    <Icon name="moon" />
                    {prefs.night ? 'Use light mode' : 'Toggle dark mode'}
                  </button>
                  <button className="iconbtn" onClick={() => openDialog('labels')}>
                    <Icon name="tag" />
                    Edit labels
                  </button>
                  <button className="iconbtn" onClick={() => openDialog('tutorial')}>
                    <Icon name="help" />
                    Help
                  </button>
                  <button className="iconbtn danger" onClick={() => openDialog('reset')}>
                    <Icon name="eliminate" />
                    Reset matrix
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
        <main>
          <section className="intro">
            <div>
              <span className="eyebrow">A little clarity. A little breathing room.</span>
              <h1 id="matrixTitle">Make room for what matters.</h1>
              <p id="matrixSubtitle">Get it out of your head. Decide what deserves your time.</p>
            </div>
            <div>
              <time className="date">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <div className="add-control">
                <button
                  id="newTask"
                  className="btn primary"
                  aria-expanded={menu === 'add'}
                  onClick={() => setMenu(menu === 'add' ? null : 'add')}
                >
                  <Icon name="plus" />
                  Add
                  <Icon name="chevron" className="add-chevron" />
                </button>
                <Popover open={menu === 'add'} onClose={() => setMenu(null)} className="add-menu">
                  <button onClick={() => openTask()}>
                    <Icon name="plus" />
                    Add task<kbd>N</kbd>
                  </button>
                  <button onClick={() => openDialog('projects')}>
                    <Icon name="folder" />
                    Add project<kbd>P</kbd>
                  </button>
                </Popover>
              </div>
            </div>
          </section>
          <section className="overview" aria-label="Task overview">
            {[
              [summary.active, 'Active tasks'],
              [summary.today, 'Due today'],
              [summary.done, 'Completed'],
              [`${summary.percent}%`, 'Completion'],
            ].map(([value, label]) => (
              <div className="stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
                {label === 'Completion' && (
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label="Completion"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={summary.percent}
                  >
                    <i style={{ width: `${summary.percent}%` }} />
                  </div>
                )}
              </div>
            ))}
          </section>
          <div className="toolbar">
            <div className="tabs" aria-label="Task status">
              {(
                [
                  ['active', 'Active'],
                  ['done', 'Completed'],
                  ['all', 'All tasks'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={filters.status === value}
                  className={filters.status === value ? 'active' : ''}
                  onClick={() => filter('status', value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="filters">
              <label className="search">
                <Icon name="search" />
                <input
                  aria-label="Find a task"
                  placeholder="Find a task…"
                  value={filters.search}
                  onChange={(e) => filter('search', e.target.value)}
                />
              </label>
              <select
                aria-label="Filter by category"
                value={filters.category}
                onChange={(e) => filter('category', e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                aria-label="Filter by project"
                value={filters.project}
                onChange={(e) => filter('project', e.target.value)}
              >
                <option value="">All projects</option>
                <option value="__none">No project</option>
                {matrix.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                id="sort"
                aria-label="Sort tasks"
                value={filters.sort}
                onChange={(e) => filter('sort', e.target.value as Filters['sort'])}
              >
                <option value="manual">Your order</option>
                <option value="due">Due date</option>
                <option value="new">Newest first</option>
              </select>
            </div>
          </div>
          <MatrixBoard
            matrix={matrix}
            labels={prefs.labels}
            filters={filters}
            onAdd={openTask}
            onEdit={(t) => openTask(t.q, t)}
            onLabels={() => openDialog('labels')}
            onToggle={updateTask}
            onMove={(id, q, before) => change((m) => moveTask(m, id, q, before), 'Task moved.')}
          />
        </main>
        <footer>
          <span>
            <Icon name="lock" /> Your tasks stay in this browser. Export a backup to keep them safe.
          </span>
          <div>
            <button className="iconbtn" onClick={exportBackup}>
              Export backup
            </button>
            <button className="iconbtn" onClick={() => importRef.current?.click()}>
              Import
            </button>
            <input
              type="file"
              accept="application/json,.json"
              ref={importRef}
              hidden
              onChange={(e) => {
                void importBackup(e.target.files?.[0]);
              }}
            />
            <button
              className="iconbtn"
              onClick={() =>
                change(
                  (m) => ({ ...m, tasks: m.tasks.filter((t) => !t.done) }),
                  'Completed tasks cleared.',
                )
              }
            >
              Clear completed
            </button>
          </div>
        </footer>
      </div>
      {editor && (
        <TaskEditor
          {...editor}
          matrix={matrix}
          labels={prefs.labels}
          change={change}
          onClose={() => setEditor(null)}
        />
      )}{' '}
      {dialog === 'projects' && (
        <ProjectsDialog matrix={matrix} change={change} onClose={() => setDialog(null)} />
      )}{' '}
      {dialog === 'labels' && (
        <LabelsDialog
          labels={prefs.labels}
          onSave={(v) => {
            prefs.setLabels(v);
            show('Labels updated.');
          }}
          onClose={() => setDialog(null)}
        />
      )}{' '}
      {dialog === 'tutorial' && (
        <TutorialDialog
          labels={prefs.labels}
          onClose={closeTutorial}
          onExamples={() => {
            change(addExamples, 'Example tasks added.');
            closeTutorial();
          }}
        />
      )}{' '}
      {dialog === 'reset' && (
        <Modal id="resetDialog" title="Start with a clear matrix?" onClose={() => setDialog(null)}>
          <p>
            All tasks will be cleared. Your projects, labels, and preferences stay. You can undo
            this action.
          </p>
          <div className="dialog-actions">
            <button className="btn" autoFocus onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button
              className="btn reset-confirm"
              onClick={() => {
                change((m) => ({ ...m, tasks: [] }), 'Matrix reset. All tasks cleared.');
                setFilters(initialFilters);
                setDialog(null);
              }}
            >
              Reset matrix
            </button>
          </div>
        </Modal>
      )}{' '}
      {dialog === 'dev' && dev.authorized && (
        <Modal id="devDialog" title="Dev tools" onClose={() => setDialog(null)}>
          <p className="quiet">Owner-only tools. Samples are saved only in this browser.</p>
          <button
            className="btn primary"
            disabled={dev.busy}
            onClick={() => {
              void dev.generate();
            }}
          >
            {dev.busy ? 'Adding samples…' : 'Add 24 sample tasks'}
          </button>
          <button
            className="btn"
            disabled={dev.busy || !matrix.tasks.some((t) => t.isDevSample)}
            onClick={dev.cleanup}
          >
            Remove Dev samples
          </button>
        </Modal>
      )}{' '}
      {toast && (
        <div id="toast" className="toast" role="status">
          <span>{toast.text}</span>
          {toast.undo && canUndo && (
            <button
              id="undo"
              onClick={() => {
                undo();
                show('Undone.');
              }}
            >
              Undo
            </button>
          )}
          <button aria-label="Dismiss notification" onClick={dismiss}>
            <Icon name="close" />
          </button>
        </div>
      )}
    </>
  );
}
