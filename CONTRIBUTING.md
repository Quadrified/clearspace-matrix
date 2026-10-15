# Changes and review

Omer Quadri, GitHub account [@Quadrified](https://github.com/Quadrified), owns and maintains this repository. Do not grant another account write, maintain, or admin access without his explicit approval. Keep repository invitations and write-enabled deploy keys under the same control.

## Pull requests

Use a focused branch and the [PR template](.github/pull_request_template.md). Describe the problem, final behavior, actual verification, and any data compatibility or recovery concerns. Keep screenshots and recordings free of personal task data.

For code changes, run the relevant checks:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

A documentation-only change does not need application tests. Check links, formatting, and the diff. For interface changes, distinguish automated DOM checks from browser and real-phone verification. See the [README](README.md) for local and phone testing.

Commit and push completed changes. Publish the site only when explicitly requested. Repository pushes do not deploy it.

## Ownership and access

[CODEOWNERS](.github/CODEOWNERS) assigns every path, including workflows and the ownership file, to `@Quadrified`. GitHub uses the ownership file from a PR's base branch. The default PR template must be merged into the default branch before GitHub uses it for new PRs.

CODEOWNERS is not an access-control mechanism. Keep other users out of **Settings → Collaborators** to prevent their direct pushes. Review invitations and deploy keys before granting access. Do not rely on a commit's author name or email to establish who pushed it.

Where the GitHub plan supports private-repository protection, configure required checks and owner review through **Settings → Rules** or **Settings → Branches**. Required checks should include the `verify` and `secrets` jobs from the Checks workflow. Account for the owner's ability to land their own PRs: GitHub does not let authors approve their own PRs. Keep force pushes and branch deletion disabled on `main`.

Feature availability depends on the GitHub plan. Adding repository files does not enable unavailable protection settings. Keep the repository private unless the owner explicitly requests otherwise.

See GitHub's documentation for [code ownership](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) and [branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
