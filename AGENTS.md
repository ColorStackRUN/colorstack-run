<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## GitHub workflow (agents and contributors)

This repository lives under a **GitHub organization** with a **protected `main`** branch.

- **Do not push directly to `main`.** Direct pushes may be rejected.
- **Assume** pull requests require **maintainer approval** before merge.

When implementing work or suggesting git operations:

1. Create a branch from the latest `main` (e.g. `feature/…`, `fix/…`, `chore/…`).
2. Commit on that branch.
3. Push the branch to `origin`.
4. Open a **pull request** into `main` instead of merging locally on `main`.

When suggesting commands, prefer this PR-based flow over `git push origin main`.
