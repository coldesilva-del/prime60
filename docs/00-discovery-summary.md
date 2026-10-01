# Prime 60 — Discovery Summary and V1 Interpretation

Date: 1 October 2026
Status: APPROVED by Colin on 1 October 2026. Confirmed: future self is "Prime Self"; tagline "Build the Man. Build the Life."; Mum weekly; cardio is 350 calories per session, five sessions a week; PUBLISH includes weekends; founding member number shown in-app only.

---

## 1. What we are building

Prime 60 is a mobile-first personal operating system for men roughly 50 to 65 who succeeded professionally while health, relationships, confidence or direction slipped. It helps a man define the person he intends to be in five years, then makes today's behaviour visibly consistent or inconsistent with that man.

It is one product. Colin is user one, with the same account as everyone else plus an admin flag. It is offered free as a lead magnet to Colin's YouTube and social audience, feeds his Mailchimp list, points people into his Skool community, and is architected for a monthly subscription after the first 100 founding members.

The unit of value is a daily loop: set intent in the morning, act, record evidence in the evening, see the trajectory. Everything else (health, projects, relationships, ideas) is an evidence source feeding one question:

> Is what I am doing today making my five-year life more inevitable?

The design job is defaults and friction, not features. The right action is the path of least resistance. Abandoning, starting new things and drifting are possible but deliberate.

## 2. Naming

- Product: **Prime 60**. Domain: `prime60.colindesilva.com`, landing page at `colindesilva.com/prime60`.
- The five-year future self needs a generic name because "2031 Colin" and "Version 10.0" are Colin's private language. Proposed: **Prime Self**, with a user-chosen target year (default: five years from sign-up). Recurring question becomes "What would your Prime Self do?" and the reinforcement line "A vote for your Prime Self." Colin to confirm or replace.
- Daily score: **Prime Score** (0 to 100). Trend: **Prime Trajectory**.
- Tagline for the app itself is open. "Build the Man. Build the Life." carries over unless Colin prefers otherwise.

## 3. Core user journey

1. **Sign up** (under 1 minute): email and password or magic link, email verification, separate marketing-consent tick box. Founding member number assigned to the first 100.
2. **Onboarding** (about 10 minutes, resumable): target year; a North Star for each pillar written against worked examples drawn from Colin's own; pick five old patterns from the library, each pre-loaded with a replacement behaviour and an IF-THEN plan; name the people who matter and their contact cadence; set three standing non-negotiables; one identity statement; health mode (track here, or coached elsewhere); optional Skool link.
3. **Today** screen: date, Prime Trajectory with four pillar bars, the three non-negotiables as taps, the one thing to finish, one Courage Rep, one person to invest in, and the I'm Stuck button.
4. **Morning check-in** (1 to 2 minutes): "Who am I becoming?" plus the identity statement; one-tap "same as yesterday" keeps non-negotiables and asks only for the one thing to finish, one Courage Rep and one person.
5. **During the day**: one-tap old-pattern log, Courage Rep, I'm Stuck (15-minute intervention), park an idea, mark a project finished.
6. **Evening check-in** (2 to 3 minutes): roughly nine taps and two ratings produce the Prime Score with a transparent breakdown. Closes with "Today I became my Prime Self by ______" (optional).
7. **Sunday review** (10 to 15 minutes): six sections, pre-filled with the week's numbers; rotates the five patterns in focus; sets next week's priority and one thing to finish.
8. **90-day cycle**: up to six objectives with metric, target, leading indicator, next action; ends with Continue, Adapt, Stop or Scale.

## 4. Decisions made (with reasons)

| Area | Decision | Reason |
| --- | --- | --- |
| Trajectory | 28-day rolling average of daily pillar scores; arrow compares last 14 days to prior 14 | Honest about what is measurable; answers "am I broadly behaving like that man" |
| One formula | Daily pillar sub-scores are computed once; trajectory, health consistency and relationship consistency are the same numbers over windows | One explainable system instead of three |
| Score inputs | Fully computable from evening taps; no typing required for a complete score | Busy days must still produce a trusted score |
| Non-negotiables | Three standing ones, editable in settings, morning override optional | Removes daily decision load |
| Tasks | No task list. A project has one "next action" field; Today shows one thing to finish | Keeps the app from becoming work |
| Patterns | Library of 15, five in focus at a time, rotated in the weekly review | Fifteen daily choices is too many |
| Finish Ratio | Counts at 30 days, ratio at 90 days, ratio hidden when starts are fewer than three | Avoids misleading precision |
| Return Rate | Share of missed non-negotiables recovered within one day | "Never miss twice" as a number |
| Streaks | One quiet streak (training). Consistency % everywhere else | Spec asked for caution |
| Idea Parking Lot | Capture is one line and one tap. The six filter questions appear only on promotion to a project | Six questions at capture time stops capture |
| Active projects | Limit 3 by default, configurable, friction dialog on the fourth | As specified |
| Health modes | "Track here" with optional fields, or "Coached elsewhere" which reduces daily health to two taps: trained, logged with coach. Weekly weigh-in either way | Colin's coach already holds the detail in Everfit; many target users have a trainer |
| Weight direction | Progress toward target weight is direction-aware | Colin is at 69.5 kg heading to 77 kg; the chart must not assume loss |
| Relationships | Groups Partner, Children, Family, Friends, Community, renameable; people with a cadence; drift shown gently, never as a task list | Non-transactional by design |
| Journal | The evening closing line is the journal. No separate journal entity | Redundant |
| Amalfi Moment | Closing section of the Vision screen, generic name "Your Moment", Colin's is the worked example | One destination, not two |
| Notifications | None in V1. Habit stacking and calendar blocks. Push added later | iOS web push is unreliable; avoid spam |
| Business tracker, Freedom Score, Financial North Star | V2 | As specified |
| AI coach, Garmin, Everfit, Apple Health | V3 | As specified |
| Billing | Not built. User has a plan field: founding, early_access, later paid | Room for subscription without rework |
| Mailchimp | Server-side add on consented sign-up, tagged "prime60-app" | Clean, lawful list |
| Skool | Link in onboarding and app; no API exists | Only option available |
| Hosting | Next.js on Railway from GitHub; Supabase cloud for auth and Postgres with RLS; Resend for auth emails | Colin's comfort with Railway; Supabase for what Railway lacks |
| Legal | Privacy policy and terms drafted by Claude for review, lawyer check advised | Health data from strangers |
| Admin | Users, activity, sign-ups per week, CSV export of consented emails, content editing | Minimal but necessary |

## 5. Colin's seed data (user one)

- Target year: 2031. North Star as per the original brief.
- Non-negotiables: TRAIN, PUBLISH, CONNECT. PUBLISH means posting content daily.
- Health mode: coached elsewhere (Everfit). Daily taps: trained, logged with coach. Weekly: weight, body fat from smart scale. Starting 69.5 kg, 11%. Target 77 kg, 10 to 12%. Programme, all variable by coach: 4 resistance sessions, 5 cardio sessions of 350 calories each regardless of duration, 16,000 steps daily.
- Devices: smart scale, Garmin. Import considered for V3.
- People: Christine (partner, daily, quality time without phones), Olivia and Ethan (children, weekly), Mum (family, weekly assumed), friends fortnightly, more added later.
- Patterns in focus (proposed five): Procrastination; Not finishing; Chasing silver bullets (starting too many things / misaligned opportunities); Hiding when he should be visible; Overthinking instead of acting. Colin can swap any.
- Active projects: Website business for small businesses (cash flow); Prime 60 (the one); AI project-management product for project managers (in development). That is three, which is the limit. Health is a daily non-negotiable, not a project. Skool and Mailchimp setup go in the Parking Lot until the app is built.

## 6. Assumptions

- Target audience wording is masculine by default but the app does not gate on gender.
- Users are on iPhone or Android with a modern browser; desktop works but is secondary.
- Australian Privacy Act applies; no health data is shared with third parties; Mailchimp receives email and name only.
- The pattern library, replacement behaviours and worked examples are Colin's IP and are editable by him as admin.
- One language, English, in V1.
- Free tier of Supabase during build; Pro from launch.

## 7. Minor uncertainties

- The name "Prime Self" and the tagline.
- Mum's cadence (assumed weekly).
- The weekly cardio calorie figure (350 stated; confirm units).
- Whether PUBLISH daily includes weekends.
- Whether the founding member number should be visible publicly (for example in Skool) or only in-app.

## 8. Contradictions and simplifications applied

- "Not a to-do app" versus a Task entity: tasks dropped.
- Multiple overlapping scores: unified.
- Finish Ratio at 7 days: dropped.
- Health tracker with 16 fields versus a coach who already tracks them: two-mode design.
- Fifteen patterns daily: five in focus.
- Downloadable lead magnet: replaced with hosted app and Add to Home Screen.

## 9. V1 scope

Included: accounts and lifecycle, legal pages, Mailchimp consent hook, Founding 100, onboarding wizard, Today, morning and evening check-ins, Prime Score and Trajectory, health (two modes, trends), patterns with replacement behaviours and IF-THEN, habit stacks, Courage Reps, I'm Stuck, Idea Parking Lot, projects with limit and Finish Ratio, relationships, weekly review, 90-day cycle, Vision with Your Moment, progress dashboard, settings, admin view, PWA install, iPhone testing, developer setup guide, deployment runbook, in-app user guide, "install on iPhone" page.

Deferred to V2: business dashboard, content and audience metrics, Freedom Score, Financial North Star, push notifications, billing.

Deferred to V3: AI coach, pattern-insight correlations, Garmin, Everfit, Apple Health, calendar.

## 10. Workflow after approval

1. PRD. 2. Information architecture. 3. Key user flows. 4. Database schema. 5. Design system. 6. Wireframe structure. 7. Shell, auth, accounts. 8. Onboarding and Today. 9. Check-ins and scoring. 10. Behaviour engine. 11. Projects and Finish Ratio. 12. Relationships. 13. Weekly review. 14. 90-day cycle. 15. Vision. 16. Progress. 17. Admin. 18. Daily-journey and iPhone testing. 19. Design refinement. 20. Docs and deployment.
