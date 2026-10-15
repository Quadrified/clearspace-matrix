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

Get tasks out of your head and give each one a place. Clearspace combines the four-quadrant matrix with projects and due dates. It saves your work in your browser. The React frontend keeps tasks on your device. A small server adapter serves the public app. Dev tools are available only in the local development server.

| Quadrant | What belongs here | What to do |
| --- | --- | --- |
| Do first | Urgent and important | Take the next step now. |
| Schedule | Important, not urgent | Protect time for it. |
| Delegate | Urgent, not important | Ask for help or limit the effort. |
| Let go | Neither urgent nor important | Skip what adds little value. |

## What you can do

- **Manage tasks.** Create, edit, complete, delete, and move tasks between quadrants. Add notes, categories, projects, and optional due dates. In All tasks, completed tasks sit below active tasks, and newly completed tasks move to the bottom of their quadrant.
- **Organize projects.** Create and rename projects, filter their tasks, and review the task count and example titles before deleting a project and its tasks.
- **Focus timer, paused for now.** The control is temporarily hidden. Its implementation and tests remain in the codebase for later use.
- **Make it yours.** Customize quadrant titles, subtitles, and icons. Choose from 15 icons, switch to dark mode, and adjust text size from 90% to 160%.
- **Celebrate quadrant zero.** Completing the last active task in a quadrant shows a brief checkmark and sparkle celebration. Filters, moves, deletion, and resets do not trigger it. Keyboard completion and reduced-motion preferences keep the celebration still.
- **Stay oriented while scrolling.** Urgent and Not urgent stay below the header on wide screens. Importance labels stay beside their own rows. On phones, each quadrant keeps its own urgency label visible.
- **See your progress.** Compact cards show active tasks, tasks due today, completed tasks, and completion percentage.
- **Recover and back up.** Undo task changes, export and import JSON backups, or reset all tasks and projects with confirmation. Notifications dismiss after 10 seconds.
- **Learn as you go.** A first-visit tutorial explains the matrix with examples. Replay it from Settings → Help.

The interface uses sage and forest green themes, system body typography, a serif date, custom SVG illustrations, a translucent header, and responsive layouts. The theme switch, sliding task tabs, dropdowns, dialogs, notifications, and task layouts use short, interruptible transitions. Filtering and task changes animate in place. Keyboard interactions stay immediate, and reduced-motion preferences disable movement. Reduced transparency and increased contrast are also supported.

## Built with React

The app uses React 19, TypeScript in strict mode, and Vite. Custom dropdowns use Base UI for keyboard navigation, typeahead, and focus handling. Dragging highlights the destination and insertion point, then animates cards into place. Interface icons use the official [Heroicons](https://github.com/tailwindlabs/heroicons) React package and its 24px outline style. Feature components own task editing, projects, focus sessions, customization, onboarding, and Dev tools. Pure domain functions handle filtering, moving tasks, backup merging, and metrics. Zod validates data at storage, import, and API boundaries.

Vitest and React Testing Library exercise actual React components. A separate Node test suite checks public server routes. ESLint, Prettier, a committed dependency lockfile, and GitHub Actions keep changes reviewable.

## Run locally

Use Node.js 22.12 or newer. Node.js 24 is used in CI.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Changes reload automatically. A Dev button appears automatically in the header during local development. No sign-in or special URL is needed.

For a production build:

```sh
npm run build
npm run serve:worker
```

Open [127.0.0.1:8000](http://127.0.0.1:8000) to preview the compiled React app through its production Worker. Run `npm run build` again after changing source files. No standalone HTML version is generated.

## Test on your phone

```sh
npm run dev:mobile
```

This exposes the local Vite server on your network for phone testing. Connect your phone to the same Wi-Fi and open the Network URL printed by Vite. Dev tools remain available in this development build. Your phone has its own browser storage.

The app uses dynamic viewport height, safe-area padding, touch-friendly targets, and inputs of at least 16px on touch-capable devices. Browser-bar colors follow the app's selected theme. Pinch zoom and copying task text remain available.

Check on real hardware with the keyboard open, in landscape, and while the browser address bar expands or collapses. Confirm that taps do not leave hover styles behind, dialogs and notifications avoid the notch and home indicator, and switching themes updates browser chrome. Automated tests cannot verify those behaviors. Dragging tasks still uses desktop HTML drag-and-drop; on a phone, move tasks through the task editor's quadrant picker.

## Local development tools

Run `npm run dev` or `npm start`, then use the **Dev** button in the header. It is available only in the Vite development server. There is no owner sign-in or `/dev` entrypoint.

- **Add 24 sample tasks** creates six tasks per quadrant and six each for Work, Personal, Health, and Learning. It includes three reusable test projects, varied dates, category-specific notes, and some completed tasks. The Dev popup closes after adding samples.
- **Remove Dev samples** removes only marked sample tasks. Your own tasks and project definitions stay saved.
- Both actions support Undo and affect only the current browser. Samples are generated locally, without API requests.

Production builds exclude the Dev panel and sample generator. `npm run serve:worker` previews that production build and has no Dev controls. The former `/dev` and `/api/dev/*` server routes return 404.

Development and production origins have separate browser storage. Changing code does not automatically reset your local tasks, so samples remain available across reloads until you remove them.

Changes are developed and verified locally. Deployment happens only when explicitly requested.

## Everyday shortcuts

| Shortcut | Action |
| --- | --- |
| `N` | Add a task. |
| `P` | Add or manage projects. |
| Double-click the timer | Edit remaining time as minutes or `MM:SS`. |
| `Enter` while editing the timer | Save the new remaining time. |
| `Escape` while editing the timer | Cancel the edit. |

Task and project shortcuts are inactive while typing or while a dialog is open. The **Add** dropdown sits beside the Active, Completed, and All tasks tabs and lets you add a task or project. Each quadrant also has its own **+** button. On a phone, use the task editor's quadrant selector to move a task.

## Your data

Tasks, projects, quadrant labels, appearance preferences, and tutorial dismissal are stored in `localStorage`. The app has no task database, analytics service, or third-party runtime scripts. The server only serves the app and favicon; it does not store visitor tasks.

- Every browser and site origin has its own data. Localhost and the hosted site do not share storage.
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
│   └── dev/                 # Local-only sample-data tools
├── lib/                     # Persistence, preferences, and notifications
└── styles.css               # Responsive design and appearance preferences
worker/handler.mjs           # Public app and favicon routes
scripts/                     # Worker packaging, artifact checks, local server
public/favicon.svg
.github/workflows/checks.yml # Type-check, lint, test, and production build
```

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The React suite checks legacy storage and backup compatibility, Undo, project assignment while preserving drafts, preferences, tutorial examples, Dev generation and cleanup, reset, ten-second toast dismissal, and timer editing and countdown behavior. The server suite checks public access and confirms that former Dev routes and APIs are unavailable. The build validator also checks that production excludes the Dev panel and sample generator.

These are automated DOM and server checks. Native dialog focus, drag-and-drop, responsive layout, still need browser and device testing. Browser visual verification was unavailable during the React migration.

The original implementation is preserved in the Git tag `backup/pre-react-migration`. The React migration retains the existing localStorage keys and backup formats.

## Source privacy

Credentials, local deployment identity, private keys, and task backup files are excluded from Git. The example environment file contains only an empty secret name. GitHub Actions runs Gitleaks across Git history, with detected values redacted from logs. See [security guidance](SECURITY.md) before publishing a fork or reporting a credential leak.

## Hosting

[The live site](https://clearspace-matrix.fastring19.chatgpt.site) is public and hosted through ChatGPT Sites. Vite emits a static frontend in `client-dist/` that can be hosted without authentication. Dev tools are compiled out of production. This repository does not automatically deploy on push.

See [deployment notes](docs/deployment.md) before changing the existing hosted page.
