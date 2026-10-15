# Deployment and maintenance

The public site is https://clearspace-matrix.fastring19.chatgpt.site. The Site identity in `.openai/hosting.json` stays unchanged through the React migration. The manifest omits `static.directory` because a Worker serves the app and protects Dev endpoints.

## Build and verify

Use Node.js 22.12 or newer, with Node.js 24 used in CI.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Vite emits the React frontend in `client-dist/`. The packaging script embeds its JavaScript and CSS alongside `worker/handler.mjs` in `dist/server/index.js`, copies the manifest into `dist/.openai/hosting.json`, and regenerates `standalone/clearspace.html`. Build outputs in `dist/` and `client-dist/` are ignored. Do not edit the generated standalone file directly.

Use the supported Sites workflow to synchronize source, package the exact checked source, save a version, and publish to the existing public audience. GitHub pushes run checks but do not automatically deploy to Sites.

## Secrets and identity

`DEV_OWNER_EMAIL` is a secret in the Site runtime environment. Its value must never be committed or put into a Vite environment variable. `VITE_` variables are public frontend configuration.

Dev authorization depends on identity headers supplied by ChatGPT Sites. Do not trust arbitrary client-provided headers on another host. To move hosts, serve `client-dist/` with Dev hidden or implement verified authentication on the new server.

The ordinary homepage stays anonymous. `/dev` starts owner sign-in. Other signed-in accounts must be denied access. Automated tests verify these server decisions; actual platform sign-in requires a browser integration check.

## Recovery and data

The pre-React source is preserved at Git tag `backup/pre-react-migration`. Deploying an older source version also requires building and publishing that version. Reverting Git alone does not change the live Site.

Existing localStorage keys and JSON backup formats remain compatible. Deploying at the same origin preserves browser data. Moving to a different origin requires exporting from the old site and importing into the new one.

Browser visual verification was unavailable during this migration. Validate native dialog focus, drag-and-drop, small screens, and real owner sign-in in a browser before treating those integration checks as complete.
