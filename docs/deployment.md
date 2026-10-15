# Deployment and maintenance

## Current status

The live public site is https://clearspace-matrix.fastring19.chatgpt.site.

The owner-only Dev upgrade in this repository is prepared and tested but has not yet been deployed. Sites source upload was blocked by the session's execution approval policy. The live site still serves the previous static version.

The existing Site ID remains in `.openai/hosting.json`. The new configuration removes `static.directory` because the deployment now has a server adapter. Keep the Site identity unchanged when publishing this upgrade.

## Secrets and identity

Set `DEV_OWNER_EMAIL` as a secret in the Site's runtime environment. It must be the current Site owner's account email. The key is listed without a value in `.env.example`; never commit its value.

Dev authorization depends on identity headers supplied by ChatGPT Sites. Do not deploy the adapter behind arbitrary client-supplied headers. If moving to another host, implement verified authentication there or serve only `app/` without Dev mode.

## Build and verify

```sh
npm test
npm run build
```

The build embeds `app/index.html`, `app/favicon.svg`, and `worker/handler.mjs` into `dist/server/index.js`. It copies the hosting manifest to `dist/.openai/hosting.json`. The generated `dist/` is ignored by Git.

Use the supported Sites workflow to synchronize source, package this artifact, save a version, and deploy it to the existing public audience. GitHub pushes do not deploy automatically.

After publishing, open `/` while logged out and confirm normal public access. Open `/dev`, sign in as the owner, and check the Dev button. Another signed-in account must be denied Dev access. Browser authentication remains a separate integration check from the automated server tests.

## Source maintenance

Keep `standalone/clearspace.html` synchronized with `app/index.html`. Its favicon is embedded so the page works as a single file. Dev controls stay hidden in the standalone file because it has no server authorization.

Changing origins creates a different browser-storage location. Export task data from the old origin and import it on the new one.
