<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

**Human runbook:** [README.md](README.md) covers install, scripts, env vars, project layout, Supabase migrations, CMS behavior, and the full Git workflow narrative. Read **this file first** for Next.js and git constraints agents often get wrong, then use the README as the operational checklist.

## GitHub workflow (agents and contributors)

This repository lives under a **GitHub organization** with a **protected `main`** branch.

- **Do not push directly to `main`.** Direct pushes may be rejected.
- **Assume** pull requests require **maintainer approval** before merge.
- **Use [`.github/pull_request_template.md`](.github/pull_request_template.md)** when opening PRs. Fill in summary of changes, summary of tests, post-PR activities, and impact assessment so human reviewers do not have to reconstruct the context from commits.
- **Keep branches up to date with `main` before review.** Rebase or merge the latest `main` into the PR branch, then rerun the relevant checks before requesting approval.
- **Expect GitHub Actions CI on PRs.** The CI workflow runs install, lint, typecheck, and production build checks for pull requests into `main`.

When implementing work or suggesting git operations:

1. Create **one branch per pull request** (one logical unit of work), not a new branch for every push. Use a short prefix: `feature/…`, `fix/…`, or `chore/…` plus a descriptive slug (for example `fix/nav-scroll`, not a vague `fix/bugs`).
2. **Commit and push repeatedly on that same branch** while the PR is open; each `git push` updates the existing PR. Do not spin up a fresh branch for every small follow-up commit on the same task.
3. Open a **pull request** from that branch into `main` instead of merging locally on `main`.
4. After merge, GitHub should **auto-delete the remote branch**. If it does not, delete the branch manually (and locally if you like) so the repo does not accumulate stale branches. Long-term hygiene is “one active branch per in-flight task,” not permanent `feature/` or `chore/` branches that collect unrelated work.

When suggesting commands, prefer this PR-based flow over `git push origin main`.
