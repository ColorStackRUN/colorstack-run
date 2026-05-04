# ColorStackRUN — Rutgers University–Newark

Official source for the **ColorStackRUN** chapter website at Rutgers University–Newark: the public site, shareable section routes, and the **admin CMS** used to keep chapter content accurate over time.

This document is meant to stay useful for **years**: it explains what the repo is, who may change what, how GitHub is configured, and how to run and deploy the app locally.

---

## Table of contents

1. [About this repository](#about-this-repository)
2. [Tech stack and prerequisites](#tech-stack-and-prerequisites)
3. [Roles: who does what](#roles-who-does-what)
4. [Git workflow (protected main)](#git-workflow-protected-main)
5. [Getting started](#getting-started)
6. [Scripts](#scripts)
7. [Project structure](#project-structure)
8. [Configuration (environment variables)](#configuration-environment-variables)
9. [Admin CMS](#admin-cms)
10. [Database and Supabase migrations](#database-and-supabase-migrations)
11. [Agents, IDE, and automation](#agents-ide-and-automation)

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
4. **Branch naming** (short, descriptive suffixes):
   - `feature/<short-description>` — new user-facing behavior or UI
   - `fix/<short-description>` — bug fixes
   - `chore/<short-description>` — documentation, tooling, config, refactors without product change  
   Examples: `feature/alumni-modal`, `fix/nav-scroll`, `chore/readme-full-update`.
5. **Typical sequence:** sync `main` → create branch → commit → `git push -u origin <branch>` → open PR → address review → maintainer merges.
6. **Bypass:** Only when a **maintainer explicitly instructs** a one-off bypass (for example an emergency hotfix) should anyone push or merge outside the normal PR + approval path.

**CODEOWNERS:** The repo uses [`.github/CODEOWNERS`](.github/CODEOWNERS) so review requests can route to **`@ColorStackRUN/maintainers`**. Update that file if maintainer groups change.

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

- **[AGENTS.md](AGENTS.md)** — Read this when using **Cursor**, Copilot, or other agents: it includes **Next.js version caveats** (this repo may differ from generic Next docs) and the **same GitHub workflow** as above (branches, PRs, no routine pushes to `main`).
- Automated commits should use the **chapter’s or maintainer’s** Git author identity so the GitHub contributor graph stays accurate.

---

## License and data

There is **no public open-source license** file in this repository. Site content, member imagery, and CMS data are **chapter assets**; handle them according to your org’s policies and applicable law (FERPA, university rules, ColorStack agreements, etc.).
