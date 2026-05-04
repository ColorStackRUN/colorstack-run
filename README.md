# ColorStackRUN — Rutgers University–Newark

Official website source for the **ColorStackRUN** chapter at Rutgers University–Newark: public landing experience, chapter content, and the internal admin tools used to keep the site current.

This repository is the **source of truth** for what ships to production. It is built with [Next.js](https://nextjs.org) (App Router) and TypeScript, and is intended to stay maintainable for years with clear ownership and contribution rules.

## Who may edit the live site

**Live site content** (events, executive board, gallery, partners, alumni, testimonials, links, and so on) is updated only through the **admin CMS** at `/admin` after sign-in.

**Policy:** only **executive board members** (or chapter officers explicitly delegated by the board) should receive the admin password and use the CMS. That keeps updates accountable, consistent with chapter messaging, and aligned with ColorStackRUN’s voice.

Code and infrastructure work is separate; see **Contributing and Git workflow** below. Do not hand admin credentials to contributors for “small copy fixes” unless the board explicitly approves it.

## Contributing and Git workflow

Treat `main` as **production-oriented**: it should always reflect what you are willing to ship.

- **Contributors** (members, collaborators, or anyone without maintainer responsibility): do **not** push directly to `main`. Create a **branch** from the latest `main` (for example `feature/short-description` or `fix/issue-name`), push your branch, and open a **Pull Request**.
- **Pull requests** should explain what changed and why. Link tracking issues or tasks when your team uses them.
- **Merges:** only **repository maintainers** (chapter tech lead / owners listed on GitHub) approve and merge pull requests.

**Enforcing maintainer-only merges** is done in GitHub, not in this repo: use branch protection on `main` (require pull requests, required reviewers, optional CODEOWNERS). See GitHub’s documentation on [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## Getting Started

Install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

If your environment has network interface issues, run:

```bash
pnpm exec next dev --hostname 127.0.0.1 --port 3000
```

## Project structure

- `app/page.tsx` — home route; renders the main landing experience
- `app/[section]/page.tsx` — section routes (for example `/team`, `/gallery`) for shareable URLs and metadata
- `app/components/site/` — landing sections, motion, and shared site UI
- `app/lib/content-types.ts` — typed CMS schema
- `app/lib/content-store.ts` — reads/writes site content (Supabase when configured, otherwise local file fallback)
- `data/site-content.json` — default / local fallback content (see Supabase migration for production)
- `app/admin/` — admin dashboard and change log UI
- `app/api/admin/*` — admin authentication, content PUT, uploads, and append-only change log API
- `app/lib/admin-changelog-*.ts`, `app/api/admin/changelog/` — activity log for publishes (Supabase table or `data/admin-changelog.json` without Supabase)
- `supabase/migrations/` — Postgres and storage setup (site content, media bucket, admin change log)

## Admin CMS

See **Who may edit the live site** above for who should use the CMS.

Set up environment variables:

```bash
cp .env.example .env.local
```

Then set strong values for:

- `ADMIN_DASHBOARD_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (optional, defaults to `site-media`)

Visit `/admin/login` to sign in. Admin users can:

- add/edit events and RaiderLink links
- upload event flyers
- update e-board portraits and bios
- upload and manage event gallery images
- publish changes (with an activity log entry on **Save & publish** when configured)

Changes are persisted to Supabase Postgres (`site_content_store`).
Supabase env vars are required for admin writes in production-style setups.

## Supabase migration (images + content)

1. Apply SQL migration:
   - `supabase/migrations/20260430153000_site_content_and_storage.sql`
2. For the admin **change log** table (if you use Supabase for it), apply:
   - `supabase/migrations/20260504180000_admin_changelog.sql`
   - `supabase/migrations/20260504190000_admin_changelog_author_name.sql` (if the table already existed without `author_name`)
3. Set env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `SUPABASE_STORAGE_BUCKET`).
4. Run backfill + seed:

```bash
pnpm supabase:migrate-content
```

This command uploads existing `public/uploads/**` files to Supabase Storage and seeds `public.site_content_store` (row `id = 'primary'`) with URL-rewritten content.
