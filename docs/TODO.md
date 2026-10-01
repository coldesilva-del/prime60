# Prime 60 — Running To-Do List

Updated: 1 October 2026. Check this daily. Claude keeps it current; Colin ticks his own items.

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
- [ ] Account: profile, delete account, export data
- [ ] Legal pages: privacy, terms
- [ ] Founding 100 assignment
- [ ] Mailchimp consent hook (behind env flag until keys exist)
- [x] App shell: five-tab navigation, light and dark mode, PWA manifest, icons and service worker

### Phase 3 — Onboarding and Today
- [ ] Onboarding wizard (resumable)
- [ ] Today screen

### Phase 4 — Daily loop
- [ ] Morning check-in
- [ ] Evening check-in
- [x] Prime Score engine with tests
- [x] Prime Trajectory with tests

### Phase 5 — Behaviour engine
- [ ] Pattern library, five in focus, one-tap log, full log
- [ ] Replacement behaviours and IF-THEN plans
- [ ] Habit stacks
- [ ] Courage Reps
- [ ] I'm Stuck mode with timer
- [ ] Idea Parking Lot with promotion filter
- [ ] Projects, active limit friction, Finish Ratio with tests

### Phase 6 — Health, relationships, reviews, vision
- [ ] Health: two modes, weekly weigh-in, trends
- [ ] Relationships: people, cadence, drift, connected today
- [ ] Weekly review
- [ ] 90-day cycle
- [ ] Vision and Your Moment

### Phase 7 — Progress, admin, launch
- [ ] Progress dashboard
- [ ] Admin view and CSV export
- [ ] Seed Colin's account
- [ ] Playwright daily-journey tests on iPhone viewport
- [ ] Design refinement pass
- [ ] Developer setup guide, deployment runbook, user guide, install-on-iPhone page
- [ ] Deploy to Railway, connect domain, launch checklist
