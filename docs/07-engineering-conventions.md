# Prime 60 — Engineering Conventions

Read this before writing code. Read `05-design-system.md` before writing UI.

## Stack and versions

Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript 5 strict, Tailwind CSS 4, shadcn/ui on Base UI (`@base-ui/react`), Supabase (`@supabase/ssr` 0.12, `supabase-js` 2.117), Zod 4, Vitest 5, Playwright 1.63, Serwist (Turbopack flavour) for the PWA.

Next.js 16 differences that matter:
- `middleware.ts` is `src/proxy.ts` exporting `proxy()`. Already written. Do not add another.
- `params` and `searchParams` are Promises. Use the generated `PageProps<"/route">` and `LayoutProps<"/route">` globals, and `await` them.
- Run `npx next typegen` if `PageProps` is missing after adding routes.
- `cn` is imported from the `cn` package: `import { cn } from "cn"`.

## Folder layout

```
src/app/(public)/...        public pages: landing, auth, legal, install
src/app/(app)/...           signed-in, onboarded screens; (app)/layout.tsx adds the tab bar
src/app/welcome/[step]/     onboarding (signed in, not yet onboarded)
src/app/auth/...            route handlers for callbacks
src/components/ui/          primitives (button, input, yes-no, rating-row, sheet, dialog, tabs)
src/components/layout/      page-header, section, group, prompt-banner
src/components/<feature>/   feature components
src/lib/<feature>/          queries.ts (reads), actions.ts (server actions), schemas.ts (zod)
src/lib/scoring/            pure scoring functions with tests
src/lib/supabase/           clients, types
supabase/migrations/        SQL migrations (never edit an applied one; add a new file)
```

## Data access

- Server Components read with `createClient()` from `@/lib/supabase/server`. Never pass the client to the browser.
- Writes go through Server Actions in `src/lib/<feature>/actions.ts` marked `"use server"`, validated with Zod, returning `ActionState` (`{ error?, fieldErrors?, ok? }`) or redirecting. Call `revalidatePath` after writes.
- Client components submit with `useActionState` or call actions directly from event handlers for one-tap writes (optimistic UI with `useOptimistic` where it helps).
- Always scope queries with `.eq("user_id", userId)` even though RLS enforces it; it keeps the query plan tight and the intent obvious.
- `requireProfile()` from `@/lib/profile` gives the profile and user id in any server component or action. It is request-cached.
- Days are `YYYY-MM-DD` strings in the user's timezone. Use `todayIn(profile.timezone)` from `@/lib/dates`. Never `toISOString().slice(0, 10)` for a user-facing day.
- Scores are computed with `computeScore` from `@/lib/scoring/score` and persisted on `daily_entries` when the evening check-in saves. Never recompute differently elsewhere.
- Types: `Tables<"projects">`, `Inserts<"projects">`, `Updates<"projects">` from `@/lib/supabase/types`.

## UI rules (short version of the design system)

- Mobile first, 520px max content width, 20px gutters, tab bar at the bottom (already in the layout; keep 112px bottom padding on app screens).
- Every control 44px or taller. Taps before typing. `YesNo` and `RatingRow` for check-ins. No sliders, no switches for scored items.
- Serif (`font-display`) only for: Prime Score numeral, North Star text, identity statements, closing lines, reveal lines, Your Moment, section openers in reviews. Everything else sans.
- Colours: `harbour` for actions and progress, `brass` once per screen at most for Prime Self moments, `ember` only for destructive confirmations and drift notes. Never red/green for scores.
- No cards: content sits on `paper`, separated by spacing and `Hairline`. Interactive groups use `Group` (surface, 16px radius).
- Sentence case. No all-caps labels. No eyebrow labels in caps. No arrows in button text. No em dashes in copy.
- Banned words in copy: failure, loser, bad, lazy, wasted, behind, crush, hustle, grind. Use reset, recover, recommit, return.
- Empty states: one sentence and one action.
- Motion only in response to the user, except the evening score reveal. Respect `prefers-reduced-motion`.
- Every chart has a text summary nearby. Charts are plain SVG in `src/components/charts/`, harbour line or bars on hairline gridlines, dashed `ink-faint` target lines.

## Copy

Direct, warm, calm. Second person. Buttons say what happens: Save, Finished, Start the morning, Close the day, Record Courage Rep, Park it, Pursue.

## Tests

- Pure logic gets Vitest tests next to it in `__tests__`.
- Flows get Playwright tests in `e2e/` against the dev server with an iPhone 13 device profile.
- `npm run typecheck`, `npm run lint` and `npm test` must pass before a commit.

## Commits

Small, imperative subject, body explains why. End with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
