import { toggleSubtask } from './domain/matrix';
import { ResetBoardDialog } from './features/settings/ResetBoardDialog';
import { useHeaderHeight } from './lib/useHeaderHeight';
import { Toast } from './components/Toast';
import { SoftPresence } from './components/SoftPresence';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Filters, QuadrantId, Task } from './domain/models';
import { initialFilters, quadrants } from './domain/models';
import { addExamples, moveTask, stats, toggleTask, visibleTasks } from './domain/matrix';
import { useToast } from './lib/useToast';
import { useMatrix } from './lib/useMatrix';
import { usePreferences } from './lib/usePreferences';
import { useToday } from './lib/useToday';
import { Icon } from './components/Icon';
import { AxisBoard } from './components/AxisBoard';
import { AppHeader } from './features/app/AppHeader';
import type { Menu } from './features/app/AppHeader';
import { Toolbar } from './features/app/Toolbar';
import { AppFooter } from './features/app/AppFooter';
import { useBackup } from './features/backup/useBackup';
import { FirstTask } from './features/tasks/FirstTask';
import { TaskOverview } from './features/tasks/TaskOverview';
import { MatrixBoard } from './features/tasks/MatrixBoard';
import { TaskEditor } from './features/tasks/TaskEditor';
import { ProjectsDialog } from './features/projects/ProjectsDialog';
import { LabelsDialog } from './features/settings/LabelsDialog';
// Temporarily hidden. Uncomment this import and the header control to restore Focus.
// import { FocusTimer } from './features/focus/FocusTimer';
import { TutorialDialog } from './features/tutorial/TutorialDialog';
// Vite removes this import and its sample data from production builds.
const DevTools = import.meta.env.DEV ? lazy(() => import('./features/dev/DevTools')) : null;
export default function App() {
  const { toast, show, dismiss, setPaused } = useToast();
  const { matrix, change, undo, canUndo, storageError, rawStored } = useMatrix(show);
  const prefs = usePreferences(show);
  const [filters, setFilters] = useState(initialFilters),
    [menu, setMenu] = useState<Menu>(null),
    [editor, setEditor] = useState<{ q: QuadrantId; task?: Task } | null>(null),
    [dialog, setDialog] = useState<'projects' | 'labels' | 'tutorial' | 'reset' | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  useHeaderHeight(headerRef);
  const searchRef = useRef<HTMLInputElement>(null);
  const today = useToday();
  const { importRef, exportBackup, importBackup, lastBackup } = useBackup({
    matrix,
    rawStored,
    storageError,
    change,
    notify: show,
  });
  const summary = useMemo(() => stats(matrix, today), [matrix, today]);
  const projectFilter =
    !filters.project ||
    filters.project === '__none' ||
    matrix.projects.some((project) => project.id === filters.project)
      ? filters.project
      : '';
  const boardFilters = useMemo(
    () => ({ ...filters, project: projectFilter }),
    [filters, projectFilter],
  );
  const counts = useMemo(
    () => ({
      active: summary.active,
      done: summary.done,
      all: matrix.tasks.length,
    }),
    [summary, matrix.tasks.length],
  );
  const resultCount = useMemo(
    () => quadrants.reduce((n, q) => n + visibleTasks(matrix, q.id, boardFilters).length, 0),
    [matrix, boardFilters],
  );
  const clearFilters = useCallback(
    () => setFilters((f) => ({ ...f, search: '', category: '', project: '', sort: 'manual' })),
    [],
  );
  const openTask = useCallback((q: QuadrantId = 'do', task?: Task) => {
    setMenu(null);
    setEditor({ q, task });
  }, []);
  const openDialog = useCallback((value: typeof dialog) => {
    setMenu(null);
    setDialog(value);
  }, []);
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
        target.closest(
          'input,select,textarea,[contenteditable=true],[role=combobox],[role=listbox]',
        ) ||
        document.querySelector('dialog[open], [role=listbox]')
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
  }, [openTask]);
  function filter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  const updateTask = useCallback(
    (id: string) => change((matrix) => toggleTask(matrix, id, Date.now()), 'Task updated.'),
    [change],
  );
  const updateSubtask = useCallback(
    (taskId: string, subtaskId: string) =>
      change((matrix) => toggleSubtask(matrix, taskId, subtaskId), 'Subtask updated.'),
    [change],
  );
  const editTask = useCallback((t: Task) => openTask(t.q, t), [openTask]);
  const openLabels = useCallback(() => openDialog('labels'), [openDialog]);
  const moveTaskTo = useCallback(
    (id: string, q: QuadrantId, before?: string) =>
      change((m) => moveTask(m, id, q, before), 'Task moved.'),
    [change],
  );
  return (
    <>
      <div className="wrap">
        <AppHeader
          headerRef={headerRef}
          devTools={
            DevTools && (
              <Suspense fallback={null}>
                <DevTools matrix={matrix} change={change} notify={show} />
              </Suspense>
            )
          }
          prefs={prefs}
          menu={menu}
          setMenu={setMenu}
          onResetBoard={() => openDialog('reset')}
          onLabels={openLabels}
          onHelp={() => openDialog('tutorial')}
          storageError={storageError}
        />
        <main>
          <section className="intro">
            <div>
              <time className="date">
                {new Date(today + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <h1 id="matrixTitle">Make room for what matters.</h1>
              <p id="matrixSubtitle">Get it out of your head. Decide what deserves your time.</p>
            </div>
            <AxisBoard />
          </section>
          {matrix.tasks.length > 0 && <TaskOverview summary={summary} />}
          {matrix.tasks.length === 0 && (
            <FirstTask
              onAdd={() => openTask()}
              onExamples={() => change(addExamples, 'Example tasks added.')}
            />
          )}
          <Toolbar
            filters={filters}
            projectFilter={projectFilter}
            projects={matrix.projects}
            filter={filter}
            counts={counts}
            resultCount={resultCount}
            onClearFilters={clearFilters}
            searchRef={searchRef}
            onAddTask={() => openTask()}
            onProjects={() => openDialog('projects')}
          />
          <MatrixBoard
            matrix={matrix}
            labels={prefs.labels}
            filters={boardFilters}
            today={today}
            onAdd={openTask}
            onEdit={editTask}
            onLabels={openLabels}
            onToggle={updateTask}
            onToggleSubtask={updateSubtask}
            onMove={moveTaskTo}
          />
        </main>
        <AppFooter
          importRef={importRef}
          lastBackup={lastBackup}
          taskCount={matrix.tasks.length}
          onExport={exportBackup}
          onImport={(file) => void importBackup(file)}
          onClearCompleted={() =>
            change(
              (m) => ({ ...m, tasks: m.tasks.filter((t) => !t.done) }),
              'Completed tasks cleared.',
            )
          }
        />
      </div>
      <button
        type="button"
        className="add-floating"
        aria-label="Quick add task"
        onClick={() => openTask()}
      >
        <Icon name="plus" />
      </button>
      <SoftPresence>
        {editor && (
          <TaskEditor
            key="task"
            {...editor}
            matrix={matrix}
            labels={prefs.labels}
            change={change}
            onClose={() => setEditor(null)}
          />
        )}
        {dialog === 'projects' && (
          <ProjectsDialog
            key="projects"
            matrix={matrix}
            change={change}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === 'labels' && (
          <LabelsDialog
            key="labels"
            labels={prefs.labels}
            onSave={(v) => {
              prefs.setLabels(v);
              show('Labels updated.');
            }}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === 'tutorial' && (
          <TutorialDialog
            key="tutorial"
            labels={prefs.labels}
            onClose={closeTutorial}
            onExamples={() => {
              change(addExamples, 'Example tasks added.');
              closeTutorial();
            }}
          />
        )}
        {dialog === 'reset' && (
          <ResetBoardDialog
            key="reset"
            onClose={() => setDialog(null)}
            onReset={() => {
              change(
                () => ({ tasks: [], projects: [] }),
                'Board reset. All tasks and projects cleared.',
              );
              setFilters(initialFilters);
              setDialog(null);
            }}
          />
        )}
      </SoftPresence>
      <SoftPresence>
        {toast && (
          <Toast
            key="notification"
            text={toast.text}
            undo={toast.undo && canUndo}
            onUndo={() => {
              undo();
              show('Undone.');
            }}
            onDismiss={dismiss}
            onPause={setPaused}
          />
        )}
      </SoftPresence>
    </>
  );
}
