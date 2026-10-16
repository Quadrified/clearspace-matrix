# How Clearspace works

Clearspace is a React and TypeScript app built with Vite. The frontend owns task data in the browser. The Sites Worker serves the built app and favicon. It never stores visitor tasks.

## Components and state

`App.tsx` composes the screen and coordinates editor and settings actions. Feature folders contain task, project, focus, label, tutorial, and Dev components. Shared dialogs use native HTML dialog behavior; popovers handle outside clicks and Escape. React renders task content as text. Shared Base UI selects render custom option lists and portal into the active native dialog when needed. Motion shared layouts animate task moves and reflow; presence boundaries animate task additions, filtering, and removals. Outgoing cards, popovers, dialogs, and notifications become inert and hidden from assistive technology during their short exits. Base UI handles dropdown presence through CSS transitions. `MotionProvider` observes input modality and reduced-motion changes, keeping keyboard actions immediate and disabling movement when requested.

## Board layout and task creation

`DayPanel` groups the date, illustration, fixed marketing copy and progress summary. At viewport widths of 1360px or more, a quiet board places it in a side rail. If any quadrant contains more than four tasks in the selected status tab, the rail folds into a day bar above the board to give the matrix more width. Search, category and project filters do not affect that decision, so typing does not repeatedly change the layout. Smaller screens use the day bar; marketing copy and illustration remain visually hidden outside the rail.

An empty board shows `FirstTask`, with Add your first task and Try example tasks. All quadrant FABs and the mobile quick-add button are absent until the full matrix contains a task. Saving the first task, importing tasks, or adding examples or Dev samples enables them. Cancelling the editor does not. Clearing the last task restores the starter card; filtered-empty views do not. The toolbar retains Projects, and the N shortcut remains available. The shared `AddTaskFab` uses a 180ms opacity/translation entrance, suppressed for reduced-motion or keyboard initiation.

The separate seven-step Getting Started dialog opens on first use and can be replayed through Help. It has a progress bar, a step label and Skip near the top, with Back and Next below the content. Only the final step offers example tasks. Tutorial dismissal and the board's empty state are independent.

## Domain state

`useMatrix` owns the current matrix and its previous snapshot with a reducer. Mutations create new task and project arrays. Pure domain functions implement filtering, moving, metrics, project removal, example tasks, and backup merging. A mutation validates its next matrix before dispatch; storage writes happen in an effect, outside the reducer. Undo restores tasks and projects together, once.

Zod schemas define TypeScript models and validate matrix mutations, localStorage and imported backups. IDs remain stable when editing or moving tasks. Project assignments reference project IDs, so renaming a project updates every associated task.

Tasks can contain optional subtasks for compatibility with older saved data. Steps have their own IDs, titles and completion state; checking every step does not automatically complete the parent task. Cards show notes and subtasks directly, and search includes subtask text. Due dates display as MM/DD/YYYY while storage retains ISO YYYY-MM-DD strings. In All tasks, active tasks precede completed ones and a newly completed task moves to the bottom of its quadrant.

## Persistence and compatibility

| Key                        | Contents                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `clearspace.matrix.v1`     | Version-2 tasks and projects. Legacy task arrays are accepted.  |
| `clearspace.labels.v1`     | Quadrant titles, subtitles, and icons. Marketing text is fixed. |
| `clearspace.theme`         | `night` selects dark mode.                                      |
| `clearspace.fontSize.v1`   | Text-size percentage, 90 to 160.                                |
| `clearspace.tutorial.v1`   | First-visit introduction dismissal.                             |
| `clearspace.lastBackup.v1` | Timestamp of the last exported backup.                          |

The migration preserves these keys. Older stock subtitles map to the current urgency and importance labels; custom labels remain. Legacy owner fields are preserved without adding a delegation field to the editor. Version-one task backups and version-two project backups remain importable.

If saved data cannot be read, it is left untouched and edits remain in memory. Export returns the original unreadable content as a recovery file. A failed storage write displays a warning. JSON backups contain tasks, subtasks and projects; they do not include labels or appearance preferences.

Storage events refresh task and project state across tabs on the same origin. While a dialog is open, incoming matrix updates wait until it closes. If this tab saves after the incoming update, its newer local state wins. This is browser-tab synchronization, not a cloud service or collaborative merge. Different browsers, devices and origins keep separate boards.

Import merges tasks by ID and reconciles projects by case-insensitive name. Deleting a project asks for confirmation with the total task count and up to two task titles, then removes the project and all of its tasks. Undo restores both. A task editor closes if its persisted task was deleted; new drafts drop the deleted project assignment. Reset board removes all tasks and projects while retaining labels and appearance preferences. The confirmation requires typing `Reset` exactly before its button is enabled. Undo restores tasks and projects together. Notifications, including Undo, dismiss after ten seconds; hovering or focusing the toast pauses dismissal and starts a fresh timeout when interaction ends.

## Focus timer, currently hidden

The Focus import and header control are disabled in the current app. The implementation and regression tests remain for possible restoration; the following describes that retained implementation, not an available screen.

The focus feature owns its state independently of the matrix, so a timer tick does not re-render the task board. A running session uses a target timestamp. Remaining seconds are derived from the wall clock; intervals only refresh the UI.

Start and resume close the controls and show a header countdown. Closing the popup leaves the session running. Direct clock editing pauses temporarily, accepts minutes or MM:SS, and resumes if it was running. Editing remaining time preserves the selected session length. Reset uses that selection. Completion sound is optional, and background-tab throttling can delay visual updates or sound.

Sessions last only for the current page and do not survive reloads.

## Local Dev tools

`App.tsx` conditionally imports the Dev panel using Vite's compile-time `import.meta.env.DEV` flag. The development server shows a Dev button automatically. Production builds remove that import, the panel, and the sample generator, so a URL, browser flag, or localStorage value cannot enable the tools in production.

The sample generator runs in the browser and returns 24 tasks with `isDevSample: true` plus stable Dev project definitions. Samples cover all four quadrants and Work, Personal, Health and Learning. A random 12 tasks receive two to four subtasks. Adding samples closes the Dev dialog. Cleanup removes only marked tasks; both actions use the same matrix reducer and Undo as normal edits. No API call, account identity, or owner email is involved.

The old `/dev` and `/api/dev/*` server routes return 404. The sample-data marker remains in the task schema for compatibility with existing tasks and backups. Local and hosted storage stay separate because they have different origins.

## Build outputs

Vite compiles React and TypeScript into `client-dist/`. The packaging script keeps the page references to separate hashed JavaScript and CSS URLs, and embeds their response bodies, the page and favicon into `dist/server/index.js`. The Worker routes asset requests from this bundle; JavaScript and CSS are not inlined into the HTML. Hashed assets are cached for a year, while the page revalidates with an ETag. The inline pre-paint theme script is allowed through its CSP hash. The local production preview imports this generated Worker directly. There is no separate standalone version. The build validator checks that development tools and sample data are absent from the production artifact.

Tests live beside React and domain code; Worker tests live under `tests/`, and Playwright tests under `e2e/`. CI has four jobs: code/build verification, browser regression checks, dependency auditing and secret scanning. Browser tests include desktop and simulated mobile configurations, with additional layout widths and text-size cases. Axe scans report findings without failing the suite, and screenshot capture is opt-in rather than an automatic visual comparison.

During a modal exit, its native dialog closes and the element becomes inert and hidden from accessibility queries before Motion removes it. A browser test that needs complete removal must check the DOM element, not only its accessible role. Automated checks do not replace a real-device or screen-reader review.

See the [overview](OVERVIEW.md), [deployment notes](deployment.md) and [release history](RELEASE_HISTORY.md) for contributor orientation, publishing and historical changes.
