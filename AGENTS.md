<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## GitHub workflow (agents and contributors)

This repository lives under a **GitHub organization** with a **protected `main`** branch.

- **Never commit or push directly to `main`** unless the maintainer has **explicitly asked** to bypass protections for a one-off (e.g. hotfix). Assume direct pushes will fail.
- **Assume** pull requests require **maintainer approval** before merge.

### Branch names

Use clear, short prefixes:

- `feature/<short-description>` — new behavior or UI
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — docs, tooling, config, refactors that are not user-facing features

Examples: `feature/team-card-modal`, `fix/nav-scroll-jump`, `chore/readme-governance`.

### Workflow

1. Branch from the latest `main` using one of the prefixes above.
2. Commit on that branch.
3. `git push -u origin <branch-name>`
4. Open a **pull request** into `main`.

When suggesting git commands, follow this PR-based flow; do not suggest `git push origin main` for routine work.
