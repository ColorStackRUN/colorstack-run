# ColorStackRUN — Rutgers University–Newark

Official source for the **ColorStackRUN** chapter website at Rutgers University–Newark: the public site, shareable section routes, and the **admin CMS** used to keep chapter content accurate over time.

This document is meant to stay useful for **years**: it explains what the repo is, who may change what, how GitHub is configured, and how to run and deploy the app locally.

---

## Table of contents

1. [About this repository](#about-this-repository)
2. [Quick path: contributors and coding assistants](#quick-path-contributors-and-coding-assistants)
3. [Tech stack and prerequisites](#tech-stack-and-prerequisites)
4. [Roles: who does what](#roles-who-does-what)
5. [Git workflow (protected main)](#git-workflow-protected-main)
6. [Getting started](#getting-started)
7. [Scripts](#scripts)
8. [Project structure](#project-structure)
9. [Configuration (environment variables)](#configuration-environment-variables)
10. [Admin CMS](#admin-cms)
11. [Database and Supabase migrations](#database-and-supabase-migrations)
12. [Agents, IDE, and automation](#agents-ide-and-automation)

---

## Quick path: contributors and coding assistants

Use this order whether you are a person or an **AI assistant** (Cursor, Claude Code, Copilot, and similar). It matches how maintainers expect work to land.

1. **Read [AGENTS.md](AGENTS.md) before editing application code.** It states that this repo’s **Next.js** stack can differ from generic training or blog posts, and it repeats the **GitHub** rules agents often miss (protected `main`, pull requests, branch naming). **[CLAUDE.md](CLAUDE.md)** is a pointer to the same file for Claude-based tooling.
2. **Run locally:** [Tech stack](#tech-stack-and-prerequisites) (Node LTS, **pnpm**) → [Getting started](#getting-started) (`pnpm install`, `pnpm dev`) → copy [.env.example](.env.example) to `.env.local` per [Configuration](#configuration-environment-variables). Use [Scripts](#scripts) and [Project structure](#project-structure) as you implement.
3. **Persisted content / Supabase:** If the task touches hosted CMS or migrations, read [Database and Supabase migrations](#database-and-supabase-migrations) before changing schema or env vars.
4. **Ship changes:** Follow [Git workflow (protected main)](#git-workflow-protected-main) — one named branch **per pull request**, push updates to that branch until merge, keep it up to date with `main`, fill out the PR template, and let GitHub auto-delete the branch after merge; do not push routine work straight to `main`.

Chapter roles, CMS access policy, and legal notes for assets are still in the sections below.

---

## About this repository

- **What it is:** A [Next.js](https://nextjs.org) **App Router** application (TypeScript, React 19) with a single primary landing experience and optional **section routes** (for example `/team`, `/gallery`) for URLs and metadata.
- **Source of truth:** What merges into **`main`** is what the chapter treats as ready for production. Content for the live site is stored in **Supabase** when configured (see migrations below), with local fallbacks for development.
- **Organization:** The repo lives under a **GitHub organization**. Branch protection and reviews are part of how the chapter keeps history clean and accountable.

---

## Tech stack and prerequisites

| Area | Choice |
|------|--------|
| Runtime | Node.js (LTS recommended) |
| Package manager | **pnpm** |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Backend / CMS persistence | Supabase (Postgres + Storage) when `SUPABASE_*` is set |
| Lint | ESLint (`eslint-config-next`) |

Install [pnpm](https://pnpm.io/installation) and a current **Node.js LTS** before running the commands below.

---

## Roles: who does what

### Live site content (CMS)

- **Where:** `/admin` (password-protected session).
- **Who:** **Executive board members** (or officers explicitly delegated by the board) should hold the admin password and perform CMS updates.
- **Why:** Keeps messaging, imagery, and events aligned with chapter leadership and ColorStackRUN’s voice.

**Code contributors** should not receive admin access for casual copy edits unless the board explicitly approves it. Content and code changes are governed separately.

### Code and infrastructure

- **Who:** Contributors (members, collaborators, contractors) work in **branches** and land changes via **pull requests**.
- **Who merges:** **Maintainers** only. The org uses **protected `main`** and **required maintainer approval** on pull requests before merge (see next section).

---

## Git workflow (protected main)

These rules match how the GitHub org is set up today.

1. **`main` is protected.** You cannot rely on pushing straight to `main`; that path is disabled for normal work.
2. **All changes flow through pull requests.** Open a PR from your branch into `main`.
3. **Merges require maintainer approval.** A maintainer must review and approve before GitHub allows the merge (your **main-protection** rule). Direct merges without review are not the intended workflow.
4. **Branch naming** (one branch **per PR / task**, not per push):
   - `feature/<short-description>` — new user-facing behavior or UI
   - `fix/<short-description>` — bug fixes
   - `chore/<short-description>` — documentation, tooling, config, refactors without product change  
   Examples: `feature/alumni-modal`, `fix/nav-scroll`, `chore/readme-full-update`.
5. **Keep PR branches current.** Before requesting review, update your branch with the latest `main` and rerun the relevant checks so reviewers are looking at code that can merge cleanly.
6. **CI must pass.** Pull requests into `main` run GitHub Actions for dependency install, lint, typecheck, and production build. Treat red CI as a blocker unless a maintainer explicitly says otherwise.
7. **Use the PR template.** [`.github/pull_request_template.md`](.github/pull_request_template.md) asks for summary of changes, summary of tests, post-PR activities, and impact assessment. Fill it out completely for human and agent reviewers.
8. **How many branches?** Prefer **one short-lived branch per change you want reviewed and merged**. Push **many times** to that same branch while reviewers iterate with you; you do **not** need a new branch for every push. Avoid one long-lived `feature/` or `chore/` branch that mixes unrelated work across months — that makes PRs large and hard to approve. After a PR merges, GitHub should **auto-delete the remote branch** so the list of open branches stays small.
9. **Typical sequence:** sync `main` → create one named branch for this task → commit (often many times) → `git push -u origin <branch>` (later just `git push`) → open PR with the template → address review and CI → maintainer merges → confirm branch cleanup.
10. **Bypass:** Only when a **maintainer explicitly instructs** a one-off bypass (for example an emergency hotfix) should anyone push or merge outside the normal PR + approval path.

**CODEOWNERS:** The repo uses [`.github/CODEOWNERS`](.github/CODEOWNERS) so review requests can route to **`@ColorStackRUN/maintainers`**. Important governance, CI, dependency/config, admin/auth, and Supabase migration files are explicitly listed there as maintainer-owned. Because `main-protection` requires CODEOWNER review, changes to those sensitive paths need maintainer approval before merge. Update CODEOWNERS if maintainer groups change.

**Further reading:** [GitHub — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

If the dev server has trouble binding to your network interface:

```bash
pnpm exec next dev --hostname 127.0.0.1 --port 3000
```

Production build (sanity check before release):

```bash
pnpm build
pnpm start
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local development server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check without emitting files |
| `pnpm supabase:migrate-content` | Upload `public/uploads/**` to Supabase Storage and seed `site_content_store` (see [Database and Supabase migrations](#database-and-supabase-migrations)) |

---

## Project structure

High-level map (paths are under the repo root unless noted).

| Path | Role |
|------|------|
| `app/page.tsx` | Home route; main landing UI |
| `app/[section]/page.tsx` | Section routes (`/about`, `/events`, `/team`, …) for SEO and shareable links |
| `app/layout.tsx`, `app/globals.css` | Root layout and global styles |
| `app/components/site/` | Landing sections, motion, site-specific UI |
| `app/lib/content-types.ts` | Typed schema for all CMS-backed content |
| `app/lib/content-store.ts` | Read/write site JSON (Supabase when configured, else file) |
| `app/lib/site-sections.ts` | Section slugs, metadata helpers |
| `app/admin/` | Admin UI (`/admin`, `/admin/login`, `/admin/changelog`) |
| `app/api/admin/` | Login, logout, content PUT, uploads, change log API |
| `app/lib/admin-changelog-*.ts` | Types and persistence for publish activity log |
| `data/site-content.json` | Default / local fallback site content |
| `data/admin-changelog.json` | Local fallback for change log when Supabase is not used |
| `supabase/migrations/` | SQL for Postgres tables, RLS, storage bucket |
| `scripts/supabase-migrate-content.mjs` | Backfill script invoked by `pnpm supabase:migrate-content` |
| `public/` | Static assets (logos, uploads, etc.) |
| `AGENTS.md` | Rules for AI agents and Cursor (Next.js + Git workflow) |
| `.github/CODEOWNERS` | Default reviewers / ownership hints |
| `.github/pull_request_template.md` | Required PR context for humans and agents |
| `.github/workflows/ci.yml` | GitHub Actions checks for PRs and `main` |

---

## Configuration (environment variables)

1. Copy the example file:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in values locally. **Never commit** `.env.local` or secrets.

| Variable | Role |
|----------|------|
| `ADMIN_DASHBOARD_PASSWORD` | Admin CMS login |
| `ADMIN_SESSION_SECRET` | Signed admin session cookie |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin (metadata, links) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for CMS writes and migrations |
| `SUPABASE_STORAGE_BUCKET` | Optional; defaults to `site-media` |

Admin writes and production-style content hosting expect Supabase to be configured.

---

## Admin CMS

- **URL:** `/admin/login` → session → `/admin` (content) and `/admin/changelog` (read-only publish history when enabled).
- **Who may use it:** See [Roles: who does what](#roles-who-does-what).
- **Capabilities (high level):** chapter links, events and flyers, executive board, partners, gallery, alumni, testimonials; **Save & publish** can append an activity log entry (name + summary) when the change log backend is available.

Persisted content for the public site goes to **`site_content_store`** in Postgres when Supabase is active.

---

## Database and Supabase migrations

Apply migrations in order in the Supabase SQL editor (or your org’s migration process), then set env vars and run the backfill script when moving from local files to hosted content.

### 1. Site content and media (required for hosted CMS)

- File: `supabase/migrations/20260430153000_site_content_and_storage.sql`  
- Creates `site_content_store`, storage bucket `site-media`, RLS for service role.

### 2. Admin change log (optional but recommended if you use Supabase for logging)

- `supabase/migrations/20260504180000_admin_changelog.sql`
- `supabase/migrations/20260504190000_admin_changelog_author_name.sql` — use if an older DB created `admin_changelog` without `author_name`.

### 3. Backfill from repo assets

With `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set:

```bash
pnpm supabase:migrate-content
```

This uploads existing `public/uploads/**` objects to Storage and seeds `public.site_content_store` (`id = 'primary'`) with rewritten URLs.

---

## Agents, IDE, and automation

- **Start with** [Quick path: contributors and coding assistants](#quick-path-contributors-and-coding-assistants) so the full README order matches what humans and agents should do.
- **[AGENTS.md](AGENTS.md)** — Next.js caveats for this repo and the **GitHub workflow** for implementers (branches, PRs, no routine pushes to `main`). **[CLAUDE.md](CLAUDE.md)** points to the same file for Claude Code.
- **[.github/pull_request_template.md](.github/pull_request_template.md)** — PR checklist for humans and agents. It requires branch freshness with `main`, test summaries, post-merge cleanup, and impact assessment.
- Automated commits should use the **chapter’s or maintainer’s** Git author identity so the GitHub contributor graph stays accurate.

---

## License and data

There is **no public open-source license** file in this repository. Site content, member imagery, and CMS data are **chapter assets**; handle them according to your org’s policies and applicable law (FERPA, university rules, ColorStack agreements, etc.).
