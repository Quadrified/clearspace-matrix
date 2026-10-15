# Security and source privacy

The React app is public browser code. Everything bundled into it can be read by visitors. Never put credentials, private owner information, or task data in frontend source or `VITE_` environment variables.

## What stays private

- This app currently needs no environment credentials. Keep future integrations server-side when they require secrets.
- `.openai/hosting.json` is local deployment configuration and is ignored by Git. `.openai/hosting.example.json` contains no assigned project ID. A project ID is not an authentication credential, but publishers do not need to commit their deployment identity.
- Environment files, provider state directories, private key files, and local task exports are ignored. Add a specific ignore rule for backups with other filenames before keeping them in this checkout.
- Secret-scanner reports are ignored because they may include sensitive material. CI and documented local scans use redacted output.

Git ignores do not protect files that are already tracked. Check the staged diff before committing. The original repository history is retained, including past deployment metadata and commit author metadata. Removing a file from the latest source does not remove earlier copies from history.

## Checks

CI runs Gitleaks against the fetched Git history using a pinned release and verified archive checksum. With Gitleaks installed locally, run:

```sh
gitleaks git --redact --log-opts=--all --no-banner .
```

A secret scan cannot prove that every possible sensitive value is absent. Review source and build outputs when adding integrations. CI rejects newly committed credentials after they are pushed; it does not prevent the push itself.

## Dev access

Dev tools are conditionally imported only during local Vite development and compiled out of production. No account identity or owner secret is used. Production rejects the former Dev URLs with 404. The build validator checks that the Dev panel and sample generator are absent. Do not expose the Vite development server publicly.

Visitor tasks live in localStorage. The server does not store them. Any script running on the same origin can potentially read that browser storage, so avoid adding untrusted scripts. Sharing the site does not share a visitor's tasks.

## Reporting a problem

Do not paste credentials or personal task data into an issue, pull request, screenshot, or build log. Use GitHub's private vulnerability reporting if the repository owner has enabled it. Otherwise contact the maintainer privately through their GitHub profile.

If a real credential is committed, revoke or rotate it first. Removing the current file alone is insufficient. History cleanup is a separate operation that changes commit IDs and must be coordinated with collaborators and existing clones.
