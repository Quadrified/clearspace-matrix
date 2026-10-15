# How Clearspace works

Clearspace is a React and TypeScript app built with Vite. The frontend owns task data in the browser. The Sites Worker serves the built app and favicon. It never stores visitor tasks.

## Components and state

`App.tsx` composes the screen and coordinates editor and settings actions. Feature folders contain task, project, focus, label, tutorial, and Dev components. Shared dialogs use native HTML dialog behavior; popovers handle outside clicks and Escape. React renders task content as text. Shared Base UI selects render custom option lists and portal into the active native dialog when needed. Motion shared layouts animate task moves and reflow; presence boundaries animate task additions, filtering, and removals. Outgoing cards, popovers, dialogs, and notifications become inert and hidden from assistive technology during their short exits. Base UI handles dropdown presence through CSS transitions. `MotionProvider` observes input modality and reduced-motion changes, keeping keyboard actions immediate and disabling movement when requested.

`useMatrix` owns the current matrix and its previous snapshot with a reducer. Mutations create new task and project arrays. Pure domain functions implement filtering, moving, metrics, project removal, example tasks, and backup merging. A mutation validates its next matrix before dispatch; storage writes happen in an effect, outside the reducer. Undo restores tasks and projects together, once.

Zod schemas define TypeScript models and validate localStorage and imported backups. IDs remain stable when editing or moving tasks. Project assignments reference project IDs, so renaming a project updates every associated task.

## Persistence and compatibility

| Key | Contents |
| --- | --- |
| `clearspace.matrix.v1` | Version-2 tasks and projects. Legacy task arrays are accepted. |
| `clearspace.labels.v1` | Quadrant titles, subtitles, and icons. Marketing text is fixed. |
| `clearspace.theme` | `night` selects dark mode. |
| `clearspace.fontSize.v1` | Text-size percentage, 90 to 160. |
| `clearspace.tutorial.v1` | First-visit introduction dismissal. |

The migration preserves these keys. Older stock subtitles map to the current urgency and importance labels; custom labels remain. Legacy owner fields are preserved without adding a delegation field to the editor. Version-one task backups and version-two project backups remain importable.

If saved data cannot be read, it is left untouched. The user can work in memory and export a backup. A failed storage write displays a warning. Storage events refresh task and project state across tabs when no dialog is open.

Import merges tasks by ID and reconciles projects by case-insensitive name. Deleting a project asks for confirmation with the total task count and up to two task titles, then removes the project and all of its tasks. Undo restores both. A task editor closes if its persisted task was deleted; new drafts drop the deleted project assignment. Reset board removes all tasks and projects while retaining labels and appearance preferences. The confirmation explains both removals, and Undo restores tasks and projects together. All notifications, including Undo, dismiss after ten seconds.

## Focus timer

The focus feature owns its state independently of the matrix, so a timer tick does not re-render the task board. A running session uses a target timestamp. Remaining seconds are derived from the wall clock; intervals only refresh the UI.

Start and resume close the controls and show a header countdown. Closing the popup leaves the session running. Direct clock editing pauses temporarily, accepts minutes or MM:SS, and resumes if it was running. Editing remaining time preserves the selected session length. Reset uses that selection. Completion sound is optional, and background-tab throttling can delay visual updates or sound.

Sessions last only for the current page and do not survive reloads.

## Local Dev tools

`App.tsx` conditionally imports the Dev panel using Vite's compile-time `import.meta.env.DEV` flag. The development server shows a Dev button automatically. Production builds remove that import, the panel, and the sample generator, so a URL, browser flag, or localStorage value cannot enable the tools in production.

The sample generator runs in the browser and returns 24 tasks with `isDevSample: true` plus stable Dev project definitions. Cleanup removes only marked tasks; both actions use the same matrix reducer and Undo as normal edits. No API call, account identity, or owner email is involved.

The old `/dev` and `/api/dev/*` server routes return 404. The sample-data marker remains in the task schema for compatibility with existing tasks and backups. Local and hosted storage stay separate because they have different origins.

## Build outputs

Vite compiles React and TypeScript into `client-dist/`. The packaging script embeds the compiled JS and CSS into a single HTML page, then combines it with the Worker handler in `dist/server/index.js`. This avoids separate asset routing on Sites. The local production preview imports this generated Worker directly. There is no separate standalone version. The build validator checks that development tools and sample data are absent from the production artifact.

Tests live beside React and domain code; server tests live under `tests/`. CI runs type checking, lint, both test suites, and the production build. DOM tests cannot verify device layout, native focus behavior, or device rendering.
