# RetroInBrowser

A curated directory of classic games ported to run in the browser. Links out to each port's own site; hosts no game files.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · Vercel · Cloudflare

## Features

- Searchable, filterable catalog by genre, original platform and device support
- Admin panel with a review queue for submitted and auto-discovered ports
- Daily jobs that discover new ports and check for dead links

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

See `docs/SETUP.md` for service setup.
