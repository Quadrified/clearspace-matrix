# Deployment and maintenance

The public site is https://clearspace-matrix.fastring19.chatgpt.site. The publisher keeps Site identity in a local, Git-ignored `.openai/hosting.json`. The repository includes `.openai/hosting.example.json` with no assigned identity. The manifest omits `static.directory` because a Worker serves the app and favicon.

## Build and verify

Use Node.js 22.12 or newer, with Node.js 24 used in CI.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Vite emits the React frontend in `client-dist/`. The packaging script bundles its hashed JavaScript and CSS files, the page, and `worker/handler.mjs` into `dist/server/index.js`, and copies the local manifest into `dist/.openai/hosting.json` when configured. Build outputs in `dist/` and `client-dist/` are ignored. Preview the built React app with `npm run serve:worker` at http://127.0.0.1:8000. The preview imports the generated Worker directly. There is no standalone HTML output.

The Worker serves the hashed assets with `cache-control: public, max-age=31536000, immutable`, so repeat visits reuse them. The page itself is sent with `no-cache` and an `ETag`, so a new deployment is picked up on the next load. Every response carries `x-content-type-options`, `referrer-policy`, and `permissions-policy` headers. The page also carries a Content-Security-Policy that allows scripts only from the site and the one inline theme script (by hash), and forbids framing. The build fails if the JavaScript exceeds its gzip budget in `scripts/check-size.mjs`.

A fresh clone builds without any account credentials or deployment identity. It does not produce a publishable Sites archive until the publisher creates `.openai/hosting.json` from `.openai/hosting.example.json` and sets the existing project ID provided by Sites. Keep that file local and ignored. Never create a new Site merely because a fresh clone has no local manifest.

Use the supported Sites workflow to synchronize source, package the exact checked source, save a version, and publish to the existing public audience. GitHub pushes run checks but do not automatically deploy to Sites.

## Development and production

The app does not require server-side credentials. Dev tools run only under `npm run dev` or `npm start`. The production build excludes their panel and sample generator, and the Worker returns 404 for `/dev` and `/api/dev/*`. The previous owner email secret is no longer read by the code.

Never put private values in `VITE_` variables; they are public frontend configuration. The production frontend in `client-dist/` can be hosted statically without an authentication adapter.

Verify changes locally first. Publish only when the user explicitly asks. Existing live deployments retain their previous behavior until an updated version is published.

## Recovery and data

The pre-React source is preserved at Git tag `backup/pre-react-migration`. Deploying an older source version also requires building and publishing that version. Reverting Git alone does not change the live Site.

Existing localStorage keys and JSON backup formats remain compatible. Deploying at the same origin preserves browser data. Moving to a different origin requires exporting from the old site and importing into the new one.

Browser visual verification was unavailable during this migration. Validate native dialog focus, drag-and-drop, and small screens in a browser before treating those integration checks as complete.
