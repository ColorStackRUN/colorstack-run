<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## GitHub workflow (agents and contributors)

This repository lives under a **GitHub organization** with a **protected `main`** branch.

- **Do not push directly to `main`.** Direct pushes may be rejected.
- **Assume** pull requests require **maintainer approval** before merge.

When implementing work or suggesting git operations:

1. Create **one branch per pull request** (one logical unit of work), not a new branch for every push. Use a short prefix: `feature/…`, `fix/…`, or `chore/…` plus a descriptive slug (for example `fix/nav-scroll`, not a vague `fix/bugs`).
2. **Commit and push repeatedly on that same branch** while the PR is open; each `git push` updates the existing PR. Do not spin up a fresh branch for every small follow-up commit on the same task.
3. Open a **pull request** from that branch into `main` instead of merging locally on `main`.
4. After merge, **delete the branch** on the remote (and locally if you like) so the repo does not accumulate stale branches. Long-term hygiene is “one active branch per in-flight task,” not permanent `feature/` or `chore/` branches that collect unrelated work.

When suggesting commands, prefer this PR-based flow over `git push origin main`.
