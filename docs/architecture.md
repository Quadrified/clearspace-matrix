# How Clearspace works

The browser app lives in `app/index.html`. It uses browser APIs and plain JavaScript without a framework. `worker/handler.mjs` serves the app and adds a small owner-authorized Dev API. The dependency-free build embeds app assets in a single Worker module.

## State and rendering

`tasks` and `projects` are arrays in memory. Rendering derives the four quadrants, search and category/project filters, task counts, and completion percentage from those arrays. Card content uses DOM creation and text content rather than interpolating task text into HTML.

Task IDs stay stable when a task is moved, completed, or edited. Project assignments use project IDs, so renaming a project updates every task's displayed project name.

## Storage

| Key | Contents |
| --- | --- |
| `clearspace.matrix.v1` | A version-2 object containing `tasks` and `projects`. Legacy task arrays are also accepted. |
| `clearspace.labels.v1` | Custom quadrant titles, subtitles, and icon choices. Page branding stays fixed. |
| `clearspace.theme` | Light or dark appearance. |
| `clearspace.fontSize.v1` | Text-size percentage. |
| `clearspace.tutorial.v1` | Whether the introduction has been seen. |

Changes save to localStorage. If storage is unavailable, the app keeps the current in-memory work and prompts the user to export it. A storage event can refresh task and project state from another tab when no dialog is open.

Undo stores the previous task and project state in memory. It is a single-step recovery mechanism and is not a persistent history. Clearing or resetting tasks leaves project definitions and quadrant customization saved.

## Focus timer

A running timer stores its target end time and derives remaining seconds from `Date.now()`. A polling callback updates the view, but the countdown does not depend on counting interval ticks. Background-tab throttling can delay UI updates and the completion sound.

Starting or resuming closes the dialog and updates the Focus button. Opening the controls leaves the session running. Direct countdown editing temporarily pauses the timer, validates the input, then resumes if it was running. Editing remaining time leaves the selected session length unchanged. Reset uses that selected length.

The timer is not persisted across page reloads.

## Backup behavior

Export creates a version-2 JSON file with tasks, projects, and an export timestamp. Import validates the data before mutation and supports version-1 task-only files. Imported project names are reconciled with existing project names. Custom labels and appearance settings are stored separately and are not included in task backups.

## Owner Dev authorization

Public routes work without identity. `/dev` redirects anonymous callers to the platform-owned `/signin-with-chatgpt` route. The server checks both platform identity headers and compares the signed-in email with `DEV_OWNER_EMAIL`, supplied as a secret. Missing configuration fails closed. Other accounts receive a denial.

`GET /api/dev/status` only returns whether the current visitor is authorized. `POST /api/dev/tasks` requires owner identity, the same Origin, and JSON. It returns 24 generated tasks without writing to a database. Authorization responses are not cacheable.

The client stores generated tasks with `isDevSample: true`, so cleanup can distinguish them from real tasks. The marker survives task edits and task backup import/export. Generated project names are reused on subsequent runs. Undo restores both tasks and projects.

The identity headers are trusted only behind ChatGPT Sites dispatch. A different host must verify identity itself before populating them. The local server passes no owner secret, so Dev controls remain disabled there.
