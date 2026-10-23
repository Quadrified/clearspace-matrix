<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Clearspace logo">
</p>
<h1 align="center">Clearspace</h1>
<p align="center"><strong>Make room for what matters.</strong></p>
<p align="center">A personal Eisenhower Matrix for sorting tasks, organizing projects, and focusing on one thing at a time.</p>
<p align="center"><a href="https://clearspace-matrix.fastring19.chatgpt.site"><strong>Open Clearspace →</strong></a> · <a href="docs/OVERVIEW.md"><strong>How it works</strong></a></p>

![Clearspace design overview](docs/preview.svg)

_Design overview using the project's own SVG artwork._

New here? Start with the [project overview](docs/OVERVIEW.md) for the tech stack, a flowchart of how the app works, and what tests and CI run.

## A calmer way to plan

Get tasks out of your head and give each one a place. Clearspace combines the four-quadrant matrix with projects and due dates. It saves your work in your browser. The React frontend keeps tasks on your device. A small server adapter serves the public app. Dev tools are available only in the local development server.

| Quadrant | What belongs here            | What to do                        |
| -------- | ---------------------------- | --------------------------------- |
| Do first | Urgent and important         | Take the next step now.           |
| Schedule | Important, not urgent        | Protect time for it.              |
| Delegate | Urgent, not important        | Ask for help or limit the effort. |
| Let go   | Neither urgent nor important | Skip what adds little value.      |

## What you can do

- **Manage tasks.** Create, edit, complete, delete, and move tasks between quadrants. Add notes, categories, projects, and optional due dates. The due-date field uses `MM/DD/YYYY`; calendar selection and quick dates use the same display format. In All tasks, completed tasks sit below active tasks, and newly completed tasks move to the bottom of their quadrant.
- **Break tasks into steps.** Add up to 100 subtasks in the task editor, rename or remove steps, and check them off in the editor or directly on the card. Cards show every step and a completed count. Press Enter in a step to add another. Empty steps are skipped when saving. Completing subtasks does not automatically complete their parent task. Subtasks are searchable, saved locally, included in backups, and support Undo.
- **Organize projects.** Create and rename projects, filter their tasks, and review the task count and example titles before deleting a project and its tasks.
- **Make it yours.** Customize quadrant titles, subtitles, and icons. Choose from 15 icons, pick Auto (follow your system), Light, or Dark appearance, and adjust text size from 90% to 160%.
- **Celebrate quadrant zero.** Completing the last active task in a quadrant shows a brief checkmark and sparkle celebration. Filters, moves, deletion, and resets do not trigger it. Keyboard completion and reduced-motion preferences keep the celebration still.
- **See the whole board at once.** "Urgent / not urgent" runs across the top and "important / not important" down the side. The four quadrants share the screen equally and only their task lists scroll.
- **See your progress.** The top bar shows today's date and a completion ring; the status tabs carry the active and completed counts.
- **Recover and back up.** Undo task changes, Export and Import JSON backups, or reset all tasks and projects with confirmation. Notifications dismiss after 10 seconds.
- **Learn as you go.** A seven-step Getting Started tutorial opens on your first visit and can be replayed from Settings → Help. Dots show your progress; on an empty board, the last step offers example tasks.

The matrix leads the page. One quiet top bar holds the logo, date and progress, the Active / Completed / All tasks tabs, and icon buttons for search, filters, projects and Settings. On phones the tabs move to a second row. On an empty board, Add task and Examples take the place of progress.

The interface uses a sketchbook look: ink outlines, soft offset shadows, lined paper, tape, and handwritten notes in Caveat, with Archivo headings. Dialogs, tabs, dropdowns, notifications, and task moves use short, interruptible transitions, and dragging a card lifts and tilts it. Keyboard interactions stay immediate, and reduced-motion preferences disable movement. Reduced transparency and increased contrast are also supported.

## Built with React

The app uses React 19, TypeScript in strict mode, and Vite. Custom dropdowns use Base UI for keyboard navigation, typeahead, and focus handling. Dragging highlights the destination and insertion point, then animates cards into place. Interface icons use the official [Heroicons](https://github.com/tailwindlabs/heroicons) React package and its 24px outline style. The code is layered: `app/` composes the screen, `features/` own each area of the product, `state/` holds the board and preferences, and `domain/` contains the rules as pure, framework-free functions. Zod validates every change, every read from storage, and every imported backup. See the [architecture notes](docs/architecture.md) for a diagram and a walkthrough of one change.

Vitest and React Testing Library exercise actual React components. A separate Node test suite checks public server routes. ESLint, Prettier, a committed dependency lockfile, and GitHub Actions keep changes reviewable.

## Run locally

Use Node.js 24 (22.22.1 or newer also works). Node 24 is pinned in `.nvmrc`, which CI also reads, so with nvm run `nvm install && nvm use` in the project folder. `.npmrc` sets `engine-strict`, so `npm ci` refuses an unsupported Node, and `npm run dev` or `npm start` stops with a clear message instead of a Vite import error.

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

Run the real-browser tests (Chromium, desktop and phone viewports) against that production build with `npm run test:e2e`.

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

Each Dev batch gives a randomly selected 12 of its 24 tasks two to four subtasks. Active tasks include completed and incomplete steps; completed tasks have all their steps checked.

Production builds exclude the Dev panel and sample generator. `npm run serve:worker` previews that production build and has no Dev controls. The former `/dev` and `/api/dev/*` server routes return 404.

Development and production origins have separate browser storage. Changing code does not automatically reset your local tasks, so samples remain available across reloads until you remove them.

Changes are developed and verified locally. Deployment happens only when explicitly requested.

## Everyday shortcuts

| Shortcut | Action                  |
| -------- | ----------------------- |
| `N`      | Add a task.             |
| `P`      | Add or manage projects. |
| `Escape` | Clear and leave search. |

Shortcuts are inactive while typing or while a dialog is open. On an empty board, use **Add task**, **Examples**, or the `N` shortcut. Each quadrant's **+** button appears after a task is saved or examples are added, with a brief reveal that respects reduced motion and keyboard input. Cancelling the editor keeps the board empty. Clearing every task restores that empty-board experience; filters do not affect button availability. On a phone, use the task editor's quadrant selector to move a task.

## Your data

Tasks, projects, quadrant labels, appearance preferences, and tutorial dismissal are stored in `localStorage`. The app has no task database, analytics service, or third-party runtime scripts. The server only serves the app and favicon; it does not store visitor tasks.

- Every browser and site origin has its own data. Localhost and the hosted site do not share storage.
- Tasks do not sync across devices or people. Sharing the website shares the tool, not your tasks.
- Clearing browser data removes saved work. Export backups regularly.
- JSON backups include tasks, subtasks, and projects. They do not include label or appearance settings.
- Import merges tasks by ID and supports older task-only backups.

## Project structure

```text
src/
├── main.tsx                 # Entry point: error boundary, motion provider, styles
├── app/                     # Composition root: App, top bar, shortcuts, crash recovery
├── features/
│   ├── tasks/               # Matrix board, task cards, task editor, subtasks
│   ├── filters/             # Search, filters panel, status tabs
│   ├── projects/            # Project creation, renaming, deletion
│   ├── settings/            # Settings menu, labels, backups, reset
│   ├── backup/              # Export and import of JSON backups
│   ├── tutorial/            # Seven-step Getting Started
│   └── dev/                 # Local-only sample-data tools
├── domain/                  # Models, pure operations, queries, serialization (no React)
├── state/                   # useMatrix, usePreferences, useToast, localStorage keys
├── components/              # Shared dialog, popover, select, icons, illustrations
├── lib/                     # Browser helpers: ids, motion, dates, downloads
├── styles/                  # Global CSS in cascade order, ending with the sketchbook theme
└── assets/fonts/            # Archivo and Caveat subsets
worker/handler.mjs           # Public app, hashed assets, caching, and security headers
tests/                       # Worker tests (Node test runner)
e2e/                         # Real-browser tests (Playwright)
scripts/                     # Worker packaging, size budget, artifact checks, local server
public/favicon.svg
.github/workflows/checks.yml # Format, type-check, lint, test, browser tests, and production build
```

Resetting the board through Settings → "Need a fresh start?" clears every task and project. Type `Reset` exactly to enable confirmation. Labels and appearance preferences stay, and the toast offers Undo.

## Validation

```sh
npm run check
```

`npm run check` runs formatting, ESLint, strict TypeScript, tests, and the production build. Individual commands are `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Use `npm run format` or `npm run lint:fix` to apply formatting and available lint fixes.

### Commit and pull request checks

`npm ci` installs Husky hooks through the `prepare` script. Before a Git commit, lint-staged formats staged files and runs ESLint on staged JavaScript and TypeScript. The hook then runs the full type check and test suite. Use the Node version from `.nvmrc` (Node 24) in your terminal and Git client. Hook failures stop the commit. Git clients must support hooks; CI repeats the checks independently.

ESLint checks React rendering rules, Hooks, JSX accessibility, and unhandled or misused promises. TypeScript validates component props. Native modal dialogs intentionally set initial focus, so the blanket autofocus restriction is disabled. Accessibility linting does not replace keyboard or screen-reader testing.

GitHub Actions runs on pushes and pull request creation, updates, reopening, and readiness for review:

- `verify`: formatting, ESLint with zero warnings, types, tests, and production packaging validation.
- `browser`: Playwright runs the real-browser suite in Chromium at desktop and phone sizes.
- `secrets`: Gitleaks scans Git history with credentials redacted.
- `dependencies`: npm audits all dependencies and fails on high or critical vulnerabilities.

Runs have timeouts and read-only repository permissions. New commits cancel older runs on the same branch. Actions are pinned to commit hashes. Dependabot proposes weekly dependency and GitHub Actions updates after its configuration reaches the default branch. Nothing deploys automatically. CI reports failures, but blocking merges requires GitHub branch protection, which remains unavailable on this private repository's current plan.

The React suite checks legacy storage and backup compatibility, Undo, project assignment while preserving drafts, preferences, the tutorial, Dev generation and cleanup, reset, ten-second toast dismissal, and cross-tab updates. The server suite checks public access and confirms that former Dev routes and APIs are unavailable. The build validator also checks that production excludes the Dev panel and sample generator.

These are automated DOM and server checks. The Playwright suite covers native dialogs, drag-and-drop, and layouts in Chromium at desktop and phone sizes; real phones, screen readers, and motion quality still need manual review.

The original implementation is preserved in the Git tag `backup/pre-react-migration`. The React migration retains the existing localStorage keys and backup formats.

## Source privacy

Credentials, local deployment identity, private keys, and task backup files are excluded from Git. The example environment file contains only an empty secret name. GitHub Actions runs Gitleaks across Git history, with detected values redacted from logs. See [security guidance](SECURITY.md) before publishing a fork or reporting a credential leak.

## Hosting

[The live site](https://clearspace-matrix.fastring19.chatgpt.site) is public and hosted through ChatGPT Sites. Vite emits a static frontend in `client-dist/` that can be hosted without authentication. Dev tools are compiled out of production. This repository does not automatically deploy on push.

See [deployment notes](docs/deployment.md) before changing the existing hosted page.

## Learn more

Browse the [hosted releases on GitHub](https://github.com/Quadrified/clearspace-matrix/releases), the [release timeline and Git history](docs/RELEASE_HISTORY.md), or the [machine-readable source mapping](docs/release-history.json). Early reconstructed snapshots are labeled, and their private publisher configuration is excluded.

The [project overview](docs/OVERVIEW.md) explains the whole app on one page: the tech stack, flowcharts of how data moves and how changes reach the live site, the test suites, and CI/CD. For deeper detail, see the [architecture notes](docs/architecture.md) and [deployment notes](docs/deployment.md).

## Ownership and review

Maintained by [Omer Quadri, @Quadrified](https://github.com/Quadrified). Every path is assigned to him in [CODEOWNERS](.github/CODEOWNERS). The [PR template](.github/pull_request_template.md) covers the problem, changes, verification, UI evidence, data compatibility, and recovery.

See [change and access guidelines](CONTRIBUTING.md). GitHub repository permissions control who can push; CODEOWNERS alone does not block commits. Deployment remains a separate, explicitly requested action.
