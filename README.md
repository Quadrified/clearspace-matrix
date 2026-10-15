<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Clearspace logo">
</p>
<h1 align="center">Clearspace</h1>
<p align="center"><strong>Make room for what matters.</strong></p>
<p align="center">A personal Eisenhower Matrix for sorting tasks, organizing projects, and focusing on one thing at a time.</p>
<p align="center"><a href="https://clearspace-matrix.fastring19.chatgpt.site"><strong>Open Clearspace →</strong></a></p>

![Clearspace design overview](docs/preview.svg)

*Design overview using the project's own SVG artwork.*

## A calmer way to plan

Get tasks out of your head and give each one a place. Clearspace combines the four-quadrant matrix with projects, due dates, and a focus timer. It saves your work in your browser. The React frontend keeps tasks on your device. A small server adapter adds protected, owner-only Dev controls while the regular app stays public.

| Quadrant | What belongs here | What to do |
| --- | --- | --- |
| Do first | Urgent and important | Take the next step now. |
| Schedule | Important, not urgent | Protect time for it. |
| Delegate | Urgent, not important | Ask for help or limit the effort. |
| Let go | Neither urgent nor important | Skip what adds little value. |

## What you can do

- **Manage tasks.** Create, edit, complete, delete, and move tasks between quadrants. Add notes, categories, projects, and optional due dates.
- **Organize projects.** Create and rename projects, filter their tasks, and delete a project without deleting its tasks.
- **Focus.** Choose a preset or custom session, then follow the remaining time in the header. Pause, resume, reset, or double-click the countdown to edit it.
- **Make it yours.** Customize quadrant titles, subtitles, and icons. Choose from 15 icons, switch to dark mode, and adjust text size from 90% to 160%.
- **See your progress.** Compact cards show active tasks, tasks due today, completed tasks, and completion percentage.
- **Recover and back up.** Undo task changes, export and import JSON backups, or reset the task matrix with confirmation. Notifications dismiss after 10 seconds.
- **Learn as you go.** A first-visit tutorial explains the matrix with examples. Replay it from Settings → Help.

The interface uses system typography, custom SVG illustrations, a translucent header, and responsive layouts. Motion respects reduced-motion preferences, with additional support for reduced transparency and increased contrast.

## Built with React

The app uses React 19, TypeScript in strict mode, and Vite. Feature components own task editing, projects, focus sessions, customization, onboarding, and Dev tools. Pure domain functions handle filtering, moving tasks, backup merging, and metrics. Zod validates data at storage, import, and API boundaries.

Vitest and React Testing Library exercise actual React components. A separate Node test suite checks server authorization. ESLint, Prettier, a committed dependency lockfile, and GitHub Actions keep changes reviewable.

## Run locally

Use Node.js 22.12 or newer. Node.js 24 is used in CI.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Changes reload automatically. Dev controls stay hidden locally because owner sign-in is provided by the hosted Site.

For a production build:

```sh
npm run build
npm run serve:worker
```

Open [127.0.0.1:8000](http://127.0.0.1:8000). The build also generates [`standalone/clearspace.html`](standalone/clearspace.html), with React, styles, artwork, and favicon embedded. It can be opened without a server. Storage behavior for `file:` URLs varies by browser, so use localhost for a consistent origin.

## Owner-only Dev mode

**Owner-only Dev mode is deployed on the live site.**

Open [Clearspace Dev](https://clearspace-matrix.fastring19.chatgpt.site/dev) and sign in as the Site owner. A **Dev** button then appears in the header. Regular visitors do not see it and can keep using the public app without signing in.

- **Add 24 test tasks** creates six tasks per quadrant, three reusable test projects, varied dates and notes, and some completed tasks.
- **Remove test tasks** removes only tasks marked as Dev samples. Your own tasks and project definitions stay saved.
- Both actions support Undo and affect only the current browser.

The server authorizes Dev access using ChatGPT Sites identity headers and the secret `DEV_OWNER_EMAIL`. This email is configured in hosted environment settings, never embedded in the client or committed to the repository. Anonymous and other signed-in accounts are rejected.

## Everyday shortcuts

| Shortcut | Action |
| --- | --- |
| `N` | Add a task. |
| `P` | Add or manage projects. |
| Double-click the timer | Edit remaining time as minutes or `MM:SS`. |
| `Enter` while editing the timer | Save the new remaining time. |
| `Escape` while editing the timer | Cancel the edit. |

Task and project shortcuts are inactive while typing or while a dialog is open. Each quadrant also has its own **+** button. On a phone, use the task editor's quadrant selector to move a task.

## Your data

Tasks, projects, quadrant labels, appearance preferences, and tutorial dismissal are stored in `localStorage`. The app has no task database, analytics service, or third-party runtime scripts. The server only serves the app, authorizes Dev access, and returns sample task data; it does not store visitor tasks.

- Every browser and site origin has its own data. Local files, localhost, and the hosted site do not share storage.
- Tasks do not sync across devices or people. Sharing the website shares the tool, not your tasks.
- Clearing browser data removes saved work. Export backups regularly.
- JSON backups include tasks and projects. They do not include label, appearance, or timer settings.
- Import merges tasks by ID and supports older task-only backups.
- Focus sessions run in the current page. Reloading or closing the page stops the session.

## Project structure

```text
src/
├── App.tsx                  # Screen composition and cross-feature actions
├── components/              # Dialog, popover, icons, and illustrations
├── domain/                  # Typed models, schemas, and pure matrix operations
├── features/
│   ├── tasks/               # Task editor and matrix board
│   ├── projects/            # Project creation and editing
│   ├── focus/               # Timer UI and time calculations
│   ├── settings/            # Quadrant labels and icon picker
│   ├── tutorial/            # Seven-step introduction
│   └── dev/                 # Owner-authorized sample-data client
├── lib/                     # Persistence, preferences, and notifications
└── styles.css               # Responsive design and appearance preferences
worker/handler.mjs           # Public routes and protected Dev API
scripts/                     # Worker packaging, artifact checks, local server
public/favicon.svg
standalone/clearspace.html   # Generated offline build
.github/workflows/checks.yml # Type-check, lint, test, and production build
```

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The React suite checks legacy storage and backup compatibility, Undo, project assignment while preserving drafts, preferences, tutorial examples, Dev generation and cleanup, reset, ten-second toast dismissal, and timer editing and countdown behavior. The server suite checks public access, owner authorization, sign-in routing, request-origin protection, and sample data.

These are automated DOM and server checks. Native dialog focus, drag-and-drop, responsive layout, and real platform sign-in still need browser and device testing. Browser visual verification was unavailable during the React migration.

The original implementation is preserved in the Git tag `backup/pre-react-migration`. The React migration retains the existing localStorage keys and backup formats.

## Hosting

[The live site](https://clearspace-matrix.fastring19.chatgpt.site) is public and hosted through ChatGPT Sites. Vite emits a static frontend in `client-dist/` that can be hosted without Dev authorization. The protected Dev feature requires the server adapter and trusted platform identity. This repository does not automatically deploy on push.

See [deployment notes](docs/deployment.md) before changing the existing hosted page.
