# How Clearspace works

Clearspace is a React and TypeScript app built with Vite. The frontend owns task data in the browser. The Sites Worker serves the built app and authorizes the small Dev API. It never stores visitor tasks.

## Components and state

`App.tsx` composes the screen and coordinates editor and settings actions. Feature folders contain task, project, focus, label, tutorial, and Dev components. Shared dialogs use native HTML dialog behavior; popovers handle outside clicks and Escape. React renders task content as text.

`useMatrix` owns the current matrix and its previous snapshot with a reducer. Mutations create new task and project arrays. Pure domain functions implement filtering, moving, metrics, project removal, example tasks, and backup merging. A mutation validates its next matrix before dispatch; storage writes happen in an effect, outside the reducer. Undo restores tasks and projects together, once.

Zod schemas define TypeScript models and validate localStorage, imported backups, and Dev API results. IDs remain stable when editing or moving tasks. Project assignments reference project IDs, so renaming a project updates every associated task.

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

Import merges tasks by ID and reconciles projects by case-insensitive name. Deleting a project removes its assignments, not its tasks. Reset board removes all tasks and projects while retaining labels and appearance preferences. The confirmation explains both removals, and Undo restores tasks and projects together. All notifications, including Undo, dismiss after ten seconds.

## Focus timer

The focus feature owns its state independently of the matrix, so a timer tick does not re-render the task board. A running session uses a target timestamp. Remaining seconds are derived from the wall clock; intervals only refresh the UI.

Start and resume close the controls and show a header countdown. Closing the popup leaves the session running. Direct clock editing pauses temporarily, accepts minutes or MM:SS, and resumes if it was running. Editing remaining time preserves the selected session length. Reset uses that selection. Completion sound is optional, and background-tab throttling can delay visual updates or sound.

Sessions last only for the current page and do not survive reloads.

## Dev authorization

The frontend asks `/api/dev/status` whether it may show Dev controls. Authorization lives in `worker/handler.mjs`, using trusted Sites identity headers and the `DEV_OWNER_EMAIL` runtime secret. `/dev` starts platform sign-in. Anonymous visitors can use `/` without sign-in.

Generation requires an owner POST, same-origin request, and JSON body. It returns 24 sample tasks with `isDevSample: true` and stable Dev project definitions. Cleanup removes only those marked tasks. Neither endpoint stores user task data. Client-side hiding is not the security boundary.

## Build outputs

Vite compiles React and TypeScript into `client-dist/`. The packaging script embeds the compiled JS and CSS into a single HTML page, then combines it with the Worker handler in `dist/server/index.js`. This avoids separate asset routing on Sites. The same build generates the offline HTML with an embedded favicon. Server secrets never enter the frontend bundle.

Tests live beside React and domain code; server tests live under `tests/`. CI runs type checking, lint, both test suites, and the production build. DOM tests cannot verify device layout, native focus behavior, or real platform authentication.
