<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## GitHub workflow (agents and contributors)

This repository lives under a **GitHub organization** with a **protected `main`** branch.

- **Do not push directly to `main`.** Direct pushes may be rejected.
- **Assume** pull requests require **maintainer approval** before merge.

When implementing work or suggesting git operations:

1. Create a branch from the latest `main` for each **unit of work** (e.g. `feature/…`, `fix/…`, `chore/…`).
2. Make one or more commits on that same branch as the work evolves.
3. Push the branch to `origin` as needed (backup, collaboration, or CI).
4. Open a **pull request** into `main` instead of merging locally on `main`.

Do **not** create a new branch for every single commit. Create a new branch when the work is unrelated and should be reviewed in a separate PR.

When suggesting commands, prefer this PR-based flow over `git push origin main`.

For all commits, do not include cursoragent or claude as co-authors.
