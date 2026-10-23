# Deployment and maintenance

The public site is https://clearspace-matrix.fastring19.chatgpt.site. The publisher keeps Site identity in a local, Git-ignored `.openai/hosting.json`. The repository includes `.openai/hosting.example.json` with no assigned identity. The manifest omits `static.directory` because a Worker serves the app and favicon.

## At a glance

1. Pushes and merges run CI only. Nothing deploys until the owner explicitly asks.
2. Pick the exact GitHub commit to publish and confirm its CI run is green.
3. Build it (`npm ci && npm run build`); optionally preview with `npm run serve:worker`.
4. Publish that build to the existing Site through the Sites workflow and confirm the deployment succeeded.
5. Record the release in `docs/release-history.json`, `docs/RELEASE_HISTORY.md` and a `site-vN` GitHub release.

The sections below give the detail for each step.

## Select source and verify

Use Node.js 24 (22.22.1 or newer also works). Node.js 24 is pinned in `.nvmrc` and used by CI. Select the exact GitHub commit requested for publication and check its CI result. If publishing a merged PR, confirm that the selected main source matches the reviewed changes. Do not include unrelated workspace edits or an older snapshot branch.

The Checks workflow runs formatting, ESLint, TypeScript, unit/component tests, Worker tests, production build validation and the Playwright suite. Separate jobs audit dependencies and scan Git history for secrets. The current owner workflow leaves tests to GitHub CI; do not run local tests merely to publish a version already checked there.

Build and preview the selected source locally when needed for packaging:

```sh
npm ci
npm run build
npm run serve:worker
```

The build performs type checking, compilation, a 200 kB gzipped JavaScript budget check and artifact validation. It does not run the test suites. See the [overview](OVERVIEW.md#tests) for the test commands and their coverage.

Vite emits the React frontend in `client-dist/`. The packaging script bundles its hashed JavaScript and CSS files, the page, and `worker/handler.mjs` into `dist/server/index.js`, and copies the local manifest into `dist/.openai/hosting.json` when configured. Build outputs in `dist/` and `client-dist/` are ignored. Preview the built React app with `npm run serve:worker` at http://127.0.0.1:8000. The preview imports the generated Worker directly. There is no standalone HTML output.

The Worker serves the hashed assets with `cache-control: public, max-age=31536000, immutable`, so repeat visits reuse them. The page itself is sent with `no-cache` and an `ETag`, so a new deployment is picked up on the next load. Every response carries `x-content-type-options`, `referrer-policy`, and `permissions-policy` headers. The page also carries a Content-Security-Policy that allows scripts only from the site and the one inline theme script (by hash), and forbids framing. The build fails if the JavaScript exceeds its gzip budget in `scripts/check-size.mjs`.

A fresh clone builds without any account credentials or deployment identity. It does not produce a publishable Sites archive until the publisher creates `.openai/hosting.json` from `.openai/hosting.example.json` and sets the existing project ID provided by Sites. Keep that file local and ignored. Never create a new Site merely because a fresh clone has no local manifest.

## Publish through Sites

Use the supported Sites workflow to open the existing publishing checkout, synchronize the selected source, build/package it, save a version and publish to the existing public audience. Preserve the publisher's local hosting manifest and Git metadata when copying source. Check tracked files against the selected GitHub commit before publication.

The source helper commits the publishing copy to a separate Sites repository. Its commit SHA can therefore differ from the GitHub commit even when application files match. Record both SHAs and the saved version number. Pass the helper's verified archive and source commit to the Sites publishing tools, then confirm the deployment reaches `succeeded` and record the returned live URL. Resume an existing pending deployment rather than creating duplicates.

Source credentials belong only in session memory and the helper's hidden stdin, never in shell arguments, tracked files or logs. GitHub pushes and merges run checks but do not automatically deploy to Sites. Do not change the site's public audience as part of an ordinary update.

## Development and production

The app does not require server-side credentials. Dev tools run only under `npm run dev` or `npm start`. The production build excludes their panel and sample generator, and the Worker returns 404 for `/dev` and `/api/dev/*`. The previous owner email secret is no longer read by the code.

Never put private values in `VITE_` variables; they are public frontend configuration. The production frontend in `client-dist/` can be hosted statically without an authentication adapter.

Use the selected commit's CI results for automated verification. Publish only when the user explicitly asks. Existing live deployments retain their previous behavior until an updated version is published.

## Recovery and data

The pre-React source is preserved at Git tag `backup/pre-react-migration`. Deploying an older source version also requires building and publishing that version. Reverting Git alone does not change the live Site.

Existing localStorage keys and JSON backup formats remain compatible. Deploying at the same origin preserves browser data. Moving to a different origin requires exporting from the old site and importing into the new one.

Playwright verifies Chromium interaction and layout behavior using desktop and simulated mobile configurations. Axe findings are currently reported rather than used as a failing accessibility gate; optional screenshots are captures, not automatic visual-diff assertions. Real-phone behavior, native keyboard interactions and visual motion quality still require manual review. Report those limits separately from a successful build or deployment.

## Releases and historical snapshots

The [release timeline](RELEASE_HISTORY.md) and [source mapping](release-history.json) record successful hosted versions. GitHub tags `site-vN` follow the hosting version number, not the package's semantic version. The first 33 records were created retrospectively. Source times, deployment-record timestamps, and GitHub publication dates describe different events.

Some tags point to matching existing GitHub commits. Others preserve reconstructed snapshots with publisher configuration omitted. The `hosted-release-history` branch is an archive of older implementations, not a branch to merge into main or deploy as the current app. Creating a GitHub release or tag does not itself publish a Sites version.

After every explicitly requested deployment succeeds:

1. Read the saved Sites version and terminal deployment status. Use the actual hosting version number; do not infer it from a tag or package version.
2. Append that version to `docs/release-history.json` and `docs/RELEASE_HISTORY.md`. Record the saved Sites source SHA, exact deployed GitHub source SHA, source time, deployment-record update time, success status, and a short change summary. Use America/Toronto offsets for new timestamps and preserve existing records.
3. Create the corresponding `site-vN` GitHub release targeting the exact deployed GitHub source commit. Include the release notes and updated timeline and JSON as release assets. Keep publisher configuration and credentials out of the records.
4. Format and review the documentation, then commit and push these release-log updates directly to `main`. The owner has authorized direct pushes for these documentation and release JSON updates. Application changes still follow the PR workflow.

Release-log updates document an existing deployment. They do not require another deployment, and pushing them must not start a build/publish loop. Do not record failed or pending deployments as successful releases. If publishing succeeds but bookkeeping fails, finish the records for that same version without publishing again.

Reverting Git or moving a release tag does not roll back the live site; rollback requires explicitly building and publishing the selected older source.
