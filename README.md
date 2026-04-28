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

Then set a strong value for `ADMIN_DASHBOARD_PASSWORD`.

Visit `/admin/login` to sign in. Admin users can:

- add/edit events and RaiderLink links
- upload event flyers
- update e-board portraits and bios
- upload and manage event gallery images

Changes are saved to `data/site-content.json` and appear on the public site immediately.
