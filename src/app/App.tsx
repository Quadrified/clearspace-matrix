/**
 * The composition root. App owns the screen-level state (which dialog is open, which task is
 * being edited), connects the state hooks to the feature components, and holds no business
 * rules of its own: those live in `domain/`.
 */
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { AddTaskFab } from '../components/AddTaskFab';
import { SoftPresence } from '../components/SoftPresence';
import { Toast } from '../components/Toast';
import type { QuadrantId, Task } from '../domain/models';
import { stats } from '../domain/queries';
import { useBackup } from '../features/backup/useBackup';
import { StatusTabs } from '../features/filters/StatusTabs';
import { FilterSummary, ToolbarTools } from '../features/filters/Toolbar';
import { useBoardFilters } from '../features/filters/useBoardFilters';
import { ProjectsDialog } from '../features/projects/ProjectsDialog';
import { BackupSettings } from '../features/settings/BackupSettings';
import { LabelsDialog } from '../features/settings/LabelsDialog';
import { ResetBoardDialog } from '../features/settings/ResetBoardDialog';
import { SettingsMenu } from '../features/settings/SettingsMenu';
import { FirstTask } from '../features/tasks/FirstTask';
import { MatrixBoard } from '../features/tasks/MatrixBoard';
import { TaskEditor } from '../features/tasks/TaskEditor';
import { TutorialDialog } from '../features/tutorial/TutorialDialog';
import {
  markTutorialSeen,
  useFirstVisitTutorial,
} from '../features/tutorial/useFirstVisitTutorial';
import { useToday } from '../lib/useToday';
import { useMatrix } from '../state/useMatrix';
import { usePreferences } from '../state/usePreferences';
import { useToast } from '../state/useToast';
import { AppHeader } from './AppHeader';
import { DayPanel } from './DayPanel';
import { useBoardActions } from './useBoardActions';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

// Vite removes this import and its sample data from production builds.
const DevTools = import.meta.env.DEV ? lazy(() => import('../features/dev/DevTools')) : null;

type Dialog = 'projects' | 'labels' | 'tutorial' | 'reset' | null;
type EditorState = { q: QuadrantId; task?: Task } | null;

export default function App() {
  // State: notifications, the board itself, and appearance preferences.
  // The open dialog is declared first so the reset toast can wait behind the tour it opens.
  const [dialog, setDialog] = useState<Dialog>(null);
  const { toast, show, dismiss, setPaused } = useToast(dialog === 'tutorial');
  const { matrix, change, undo, canUndo, storageError, rawStored } = useMatrix(show);
  const prefs = usePreferences(show);
  const actions = useBoardActions(change);
  const backup = useBackup({ matrix, rawStored, storageError, change, notify: show });
  const board = useBoardFilters(matrix);
  const today = useToday();

  // Screen state: what is open right now.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);

  // Derived numbers for the top bar.
  const hasTasks = matrix.tasks.length > 0;
  const summary = useMemo(() => stats(matrix, today), [matrix, today]);
  const counts = useMemo(
    () => ({ active: summary.active, done: summary.done, all: matrix.tasks.length }),
    [summary, matrix.tasks.length],
  );

  const openTask = useCallback((q: QuadrantId = 'do', task?: Task) => {
    setSettingsOpen(false);
    setEditor({ q, task });
  }, []);
  const editTask = useCallback((task: Task) => openTask(task.q, task), [openTask]);
  const openDialog = useCallback((value: Dialog) => {
    setSettingsOpen(false);
    setDialog(value);
  }, []);
  const openLabels = useCallback(() => openDialog('labels'), [openDialog]);
  const closeDialog = () => setDialog(null);
  const closeTutorial = () => {
    markTutorialSeen();
    closeDialog();
  };

  useFirstVisitTutorial(() => setDialog('tutorial'));
  useKeyboardShortcuts({ n: () => openTask(), p: () => openDialog('projects') });

  const filterProps = {
    filters: board.filters,
    projectFilter: board.projectFilter,
    projects: matrix.projects,
    filter: board.setFilter,
    resultCount: board.resultCount,
    onClearFilters: board.clearFilters,
  };

  return (
    <>
      <div className="wrap">
        <AppHeader
          day={
            <DayPanel
              today={today}
              summary={summary}
              hasTasks={hasTasks}
              start={<FirstTask onAdd={() => openTask()} onExamples={actions.addExamples} />}
            />
          }
          tabs={
            <StatusTabs
              counts={counts}
              value={board.filters.status}
              onChange={(value) => board.setFilter('status', value)}
            />
          }
          tools={<ToolbarTools {...filterProps} onProjects={() => openDialog('projects')} />}
          devTools={
            DevTools && (
              <Suspense fallback={null}>
                <DevTools matrix={matrix} change={change} notify={show} />
              </Suspense>
            )
          }
          settings={
            <SettingsMenu
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              prefs={prefs}
              storageError={storageError}
              backup={
                <BackupSettings
                  importRef={backup.importRef}
                  lastBackup={backup.lastBackup}
                  taskCount={matrix.tasks.length}
                  onExport={backup.exportBackup}
                  onImport={(file) => void backup.importBackup(file)}
                />
              }
              onLabels={openLabels}
              onHelp={() => openDialog('tutorial')}
              onClearCompleted={actions.clearCompleted}
              onResetBoard={() => openDialog('reset')}
            />
          }
        />
        <main className="workspace">
          <div className="board-column">
            <FilterSummary {...filterProps} />
            <MatrixBoard
              matrix={matrix}
              labels={prefs.labels}
              filters={board.boardFilters}
              today={today}
              onAdd={openTask}
              onEdit={editTask}
              onLabels={openLabels}
              onToggle={actions.toggleTask}
              onToggleSubtask={actions.toggleSubtask}
              onMove={actions.moveTask}
            />
          </div>
        </main>
      </div>
      {hasTasks && (
        <AddTaskFab className="add-floating" label="Quick add task" onClick={() => openTask()} />
      )}

      {/* Dialogs. SoftPresence lets each one play its exit before it unmounts. */}
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
          <ProjectsDialog key="projects" matrix={matrix} change={change} onClose={closeDialog} />
        )}
        {dialog === 'labels' && (
          <LabelsDialog
            key="labels"
            labels={prefs.labels}
            onSave={(labels) => {
              prefs.setLabels(labels);
              show('Labels updated.');
            }}
            onClose={closeDialog}
          />
        )}
        {dialog === 'tutorial' && (
          <TutorialDialog
            key="tutorial"
            labels={prefs.labels}
            hasTasks={hasTasks}
            onClose={closeTutorial}
            onExamples={() => {
              actions.addExamples();
              closeTutorial();
            }}
          />
        )}
        {dialog === 'reset' && (
          <ResetBoardDialog
            key="reset"
            onClose={closeDialog}
            onReset={() => {
              actions.resetBoard();
              board.resetFilters();
              // A fresh start begins like a first visit, with the Getting Started tour.
              setDialog('tutorial');
            }}
          />
        )}
      </SoftPresence>

      {/* The single toast, with Undo for the last board change. */}
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
