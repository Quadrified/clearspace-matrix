# Deployment and maintenance

## Current deployment

- Live URL: https://clearspace-matrix.fastring19.chatgpt.site
- Audience: public.
- Static directory: `dist`.
- Source snapshot for this GitHub export: `5088be4b7f19f94af6c7a8480de24df0c7cce50d` in the existing Sites source repository.

`.openai/hosting.json` records the existing Site ID. It contains no authentication credentials. Keep the ID when updating that Site; create a different Site only when intentionally deploying a separate copy.

The GitHub repository is a source copy. A GitHub push alone does not publish to ChatGPT Sites. Use the supported Sites source-sync, version-save, and deploy flow when publishing changes there.

## Editing

1. Edit `dist/index.html` and any assets in `dist/`.
2. Keep `standalone/clearspace.html` synchronized. Its application markup, styles, and script should match `dist/index.html`; its favicon uses a data URL so it works as a single file.
3. Run `npm test` or `node tests/smoke.cjs`.
4. Check the page in a browser at desktop and phone widths, in both themes and at the largest text size.
5. Publish the exact checked source state and verify the resulting deployment.

## Other static hosts

Serve the contents of `dist/` from the root of a static site. `index.html` references `/favicon.svg`. If deploying under a subdirectory, update that favicon path for the deployment base.

Changing origins creates a new browser-storage location. Export task data from the old origin and import it on the new one. No hosted database or authentication service is required by the application code.
