Rutgers University-Newark ColorStack website built on [Next.js](https://nextjs.org) (App Router).

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

## Project Structure

- `app/page.tsx` - main landing page UI
- `app/components/site/` - landing page sections and motion components
- `app/lib/content-types.ts` - typed content schema
- `data/site-content.json` - persisted CMS content
- `app/admin/` - admin dashboard pages
- `app/api/admin/*` - admin auth/content/upload APIs

## Admin CMS

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

Changes are persisted to Supabase Postgres (`site_content_store`).
Supabase env vars are required for admin writes.

## Supabase Migration (Images + Content)

1. Apply SQL migration:
   - `supabase/migrations/20260430153000_site_content_and_storage.sql`
2. Set env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `SUPABASE_STORAGE_BUCKET`).
3. Run backfill + seed:

```bash
pnpm supabase:migrate-content
```

This command uploads existing `public/uploads/**` files to Supabase Storage and seeds `public.site_content_store` (row `id = 'primary'`) with URL-rewritten content.
