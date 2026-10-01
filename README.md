# Prime 60

Build the Man. Build the Life.

A mobile-first personal operating system for men in the second half of life. Next.js 16, Supabase, Tailwind 4, deployed on Railway.

- Product documents: `docs/` (start with `00-discovery-summary.md`, then `01-prd.md`)
- Engineering conventions: `docs/07-engineering-conventions.md`
- Developer setup: `docs/08-setup.md`
- Deployment: `docs/09-deployment.md`
- Running to-do list: `docs/TODO.md`

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (scoring, helpers) |
| `npm run test:e2e` | Playwright end-to-end tests (iPhone 13 profile) |
| `npm run db:push` | Apply `supabase/migrations` to the linked project |
| `npm run db:types` | Regenerate `src/lib/supabase/types.ts` from the linked project |
