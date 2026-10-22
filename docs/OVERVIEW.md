# Clearspace at a glance

Clearspace is a browser-local task planner built around the Eisenhower Matrix. This guide explains the product, data flow, development tools and delivery process. See the [README](../README.md) for setup details, [architecture](architecture.md) for implementation details and [deployment](deployment.md) for publishing.

## What the app does

| Quadrant | Meaning                      |
| -------- | ---------------------------- |
| Do first | Urgent and important         |
| Schedule | Important, not urgent        |
| Delegate | Urgent, not important        |
| Let go   | Neither urgent nor important |

Tasks support notes, subtasks, due dates, categories and optional projects. Users can edit, complete, delete, search, filter and reorder tasks. Desktop drag-and-drop moves tasks between quadrants; phones use the editor's quadrant picker. Subtask completion is independent of its parent. Due dates display as MM/DD/YYYY and remain ISO dates in storage.

The date and progress appear in a day bar, or a side rail on screens at least 1360px wide. If a quadrant contains more than four tasks in the selected status tab, the rail folds away to give the board more width. Search and project/category filters do not trigger that change.

On an empty board, the starter card offers Add your first task and Try example tasks. Quadrant FABs and mobile quick-add appear after tasks exist. Cancelling leaves the starter card intact; clearing all tasks restores it. Filtered-empty views keep the add controls. Projects remains in the toolbar, and N opens task creation.

Settings offers themes, text sizes from 90% to 160%, quadrant labels/icons and Help. The seven-step tutorial has a progress bar and optional example tasks at the end.

## Tech stack

| Area              | Tools                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| App               | React 19, strict TypeScript, Vite 8                                       |
| Interface         | CSS, Base UI selects, Heroicons, Motion                                   |
| State and data    | React hooks/reducer, pure domain functions, Zod, localStorage             |
| Production server | Worker serving the page, favicon and hashed assets                        |
| Tests             | Vitest, Testing Library, Node test runner, Playwright, axe-core           |
| Quality and CI    | ESLint, Prettier, Husky, lint-staged, GitHub Actions, Gitleaks, npm audit |
| Runtime           | Node 22.12 or newer locally; Node 24 in CI                                |

## How data moves

```mermaid
flowchart LR
  server["Sites Worker"] -->|"Page and assets"| ui["React interface"]
  store[(localStorage)] -->|"Read and validate"| state["useMatrix"]
  state -->|"Current board"| ui
  ui -->|"Task or project action"| rules["Pure domain operations"]
  rules -->|"Next matrix"| state
  state -->|"Validate and persist"| store
  ui -->|"Undo previous matrix"| state
  ui -->|Export| backup["JSON backup"]
  backup -->|"Parse and merge"| rules
```

The Worker supplies the app without receiving task data. React reads saved state, validates it and displays the board. Task/project actions compute a new matrix; `useMatrix` validates it, saves one previous snapshot for Undo and persists changes in an effect. Search, filters and progress are derived from state. Appearance preferences use a separate hook.

Tasks, projects and preferences stay in the current browser and origin. There is no account system, task database or cross-device sync. Tabs on the same origin receive matrix updates through storage events. Incoming updates wait while a dialog is open; a later local save takes precedence.

Backups contain tasks, subtasks and projects, excluding appearance settings. Import merges compatible data. Unreadable saved data is preserved and can be exported for recovery while edits remain in memory. Reset requires typing `Reset`, clears tasks/projects, retains appearance/labels and supports Undo.

## Finding your way around

| Path                                | Responsibility                                                        |
| ----------------------------------- | --------------------------------------------------------------------- |
| `src/App.tsx`                       | Screen composition and cross-feature actions                          |
| `src/features/`                     | Tasks, projects, day panel, settings, backups, tutorial and Dev tools |
| `src/domain/`                       | Types, validation and pure board operations                           |
| `src/lib/`                          | Persistence, preferences, date, motion and notification hooks         |
| `src/components/`, `src/styles.css` | Shared controls, illustrations and responsive styling                 |
| `worker/`, `scripts/`               | Public server, packaging, artifact checks and preview                 |
| `e2e/`, `tests/`                    | Browser and Worker tests; component tests sit beside source           |
| `.github/`                          | Workflow, Dependabot, CODEOWNERS and PR template                      |

```sh
npm ci                # dependencies and hook installation
npm run dev           # local Vite server
npm run dev:mobile    # same-network phone access
npm run build         # production packaging
npm run serve:worker  # production preview at 127.0.0.1:8000
```

The local Dev button adds 24 samples across all quadrants and categories. A random 12 tasks receive two to four subtasks. Cleanup removes marked samples. Production excludes these controls and has no `/dev` mode. Different origins and phones have separate storage.

## Tests and delivery

```mermaid
flowchart TD
  edit["Local development"] --> commit["Commit with enabled hooks"]
  commit --> push["Push / open PR"]
  push --> ci["GitHub CI: four jobs"]
  ci --> review["Review and merge, or authorized direct push"]
  review --> request{"Explicit deployment request?"}
  request -->|No| unchanged["Live site unchanged"]
  request -->|Yes| build["Build selected source and package"]
  build --> publish["Save Sites version and publish"]
  publish --> live["Confirm deployment succeeded"]
```

Pushes run CI; they do not deploy. Normal changes use PR review, while authorized direct pushes also run checks. Publishing separately selects and packages the requested source, saves a Sites version and verifies the result.

| Check          | Coverage                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `verify`       | Prettier, TypeScript, React/Hooks/accessibility ESLint, component/domain tests, Worker tests and production build |
| `browser`      | Playwright Chromium desktop and simulated mobile interactions/layouts                                             |
| `dependencies` | npm audit fails on high/critical vulnerabilities                                                                  |
| `secrets`      | Gitleaks scans Git history with values redacted                                                                   |

`npm test` runs Vitest/Testing Library and Worker tests. `npm run test:e2e` runs browser checks. `npm run check` combines formatting, lint, types, tests and build. The current owner workflow leaves tests to GitHub CI. Enabled Husky hooks format/lint staged files and run types/tests; CI checks independently.

Builds produce `client-dist/`, enforce the JavaScript gzip budget and package `dist/server/index.js`. Hashed JS/CSS remain separate browser requests served by the Worker, with immutable caching; HTML revalidates through an ETag. Artifact checks confirm production excludes Dev tools.

Axe scans report findings without failing CI. Optional screenshots capture images rather than asserting visual baselines. Simulated phones do not replace hardware, screen-reader or motion review. Super-Linter is not installed. CODEOWNERS identifies the owner but does not itself block pushes or merges. Dependabot proposes weekly dependency/action updates.

The [release timeline](RELEASE_HISTORY.md) and [source mapping](release-history.json) record each successful deployment, including labeled reconstructions for the initial retrospective history. The archive branch is historical, not the current app. More detail lives in [CONTRIBUTING](../CONTRIBUTING.md), [SECURITY](../SECURITY.md) and the [deployment guide](deployment.md).
