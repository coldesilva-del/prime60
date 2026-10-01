# Prime 60 — Running To-Do List

Updated: 1 October 2026 (all V1 screens built and compiling; awaiting Supabase key and CLI link to test live). Check this daily. Claude keeps it current; Colin ticks his own items.

## Colin's actions (only you can do these)

- [x] Supabase project created: Prime60, Sydney, ref yrvhyvenovctbzhqftre, URL https://yrvhyvenovctbzhqftre.supabase.co (1 Oct 2026)
- [ ] Paste the publishable key (Project Settings → API Keys) to Claude
- [ ] In the Terminal panel: `npx supabase login` then `npx supabase link --project-ref yrvhyvenovctbzhqftre` (enter DB password when asked)
- [ ] Create an empty private GitHub repository named `prime60` under your account. Then tell Claude the URL.
- [ ] In Supabase Authentication settings: Site URL https://prime60.colindesilva.com; Redirect URLs http://localhost:3000/** and https://prime60.colindesilva.com/**; custom SMTP via Resend (see docs/08-setup.md section 5)
- [ ] Create a Railway service for `prime60` connected to the GitHub repo (Claude will give exact steps when the repo has code).
- [ ] Add the DNS record for `prime60.colindesilva.com` pointing at Railway (Claude will give the exact record).
- [ ] Choose a Resend sending address for auth emails, for example `prime60@colindesilva.com`, and confirm the domain is verified in Resend.
- [ ] Review the privacy policy and terms Claude drafts; have a lawyer check them before launch.
- [ ] Later, parked: Mailchimp audience and API key. Skool community invite link.

## Claude's build plan

### Phase 1 — Documents (approved scope)
- [x] Discovery summary approved
- [x] 01 PRD
- [x] 02 Information architecture (user flows included)
- [x] 04 Data model and RLS
- [x] 05 Design system
- [x] 06 Wireframe structure
- [x] 07 Engineering conventions, 08 Setup guide, 09 Deployment runbook

### Phase 2 — Foundation
- [x] Scaffold Next.js, TypeScript, Tailwind, shadcn/ui, Supabase SSR
- [x] Database migrations and RLS policies written (push pending Colin's CLI login); RLS tests pending
- [x] Auth: sign up, verify, sign in, magic link, reset, sign out (untested against live Supabase)
- [x] Account: profile, delete account, export data
- [x] Legal pages: privacy, terms
- [x] Founding 100 assignment
- [x] Mailchimp consent hook (behind env flag until keys exist)
- [x] App shell: five-tab navigation, light and dark mode, PWA manifest, icons and service worker

### Phase 3 — Onboarding and Today
- [x] Onboarding wizard (resumable)
- [x] Today screen

### Phase 4 — Daily loop
- [x] Morning check-in
- [x] Evening check-in
- [x] Prime Score engine with tests
- [x] Prime Trajectory with tests

### Phase 5 — Behaviour engine
- [x] Pattern library, five in focus, one-tap log, full log
- [x] Replacement behaviours and IF-THEN plans
- [x] Habit stacks
- [x] Courage Reps
- [x] I'm Stuck mode with timer
- [x] Idea Parking Lot with promotion filter
- [x] Projects, active limit friction, Finish Ratio with tests

### Phase 6 — Health, relationships, reviews, vision
- [x] Health: two modes, weekly weigh-in, trends
- [x] Relationships: people, cadence, drift, connected today
- [x] Weekly review
- [x] 90-day cycle
- [x] Vision and Your Moment

### Phase 7 — Progress, admin, launch
- [x] Progress dashboard
- [x] Admin view and CSV export
- [ ] Seed Colin's account
- [ ] Playwright daily-journey tests on iPhone viewport (public smoke tests pass; signed-in flows need the live Supabase key)
- [ ] Design refinement pass
- [x] Developer setup guide, deployment runbook, user guide, install-on-iPhone page
- [ ] Deploy to Railway, connect domain, launch checklist
