# Prime 60 — Product Requirements Document (V1)

Version 1.0, 1 October 2026. Derived from the approved discovery summary (00).

---

## 1. Purpose

Prime 60 helps a man in the second half of his life become the person capable of creating the life he wants, by making today's behaviour visibly consistent or inconsistent with a five-year vision he defines himself.

It is a behaviour-change engine with a compass attached, not a tracker. Success is measured by daily use and by the user's own sense that the app is worth opening every morning.

Tagline: **Build the Man. Build the Life.**

## 2. Audience

Primary: men roughly 50 to 65, professionally successful, who have neglected health, physique, energy, partner, children, friendships, confidence or direction. They do not need to be taught to make money. They need to rebalance.

User one: Colin, founder. Same account type as everyone else plus an admin flag.

Reference persona for design decisions: Mark, 58, runs a consultancy, 12 kg over where he wants to be, married 26 years and "fine", two adult children he texts on birthdays, has started four side projects in two years and finished none. He will use an app on his iPhone for two minutes if it gives him something back immediately. He will not fill in forms.

## 3. Product principles

1. Every screen answers at least one of: Where am I? What matters now? What should I do next?
2. Reduce cognitive load. Three standing non-negotiables, one thing to finish, one person. Not lists.
3. Taps before typing. Free text is optional everywhere except the one thing to finish.
4. Evidence over intention. The score is earned in the evening by what happened, never by what was planned.
5. Return over perfection. Misses are events. The product measures how fast a man returns.
6. Identity over outcome. Every reinforcement line ties an action to the man he is becoming.
7. Friction is a feature. Starting a fourth project, pursuing a new idea, or abandoning a project is always possible and always deliberate.
8. Never shame. Banned words: failure, loser, bad, lazy, wasted, behind. Used instead: reset, recover, recommit, return.
9. Relationships are never a CRM. No "last contacted" leaderboards, no overdue badges on people.
10. Methodology is content, not code. Patterns, replacements, examples and review questions are editable by the admin.

## 4. Vocabulary

| Term | Meaning |
| --- | --- |
| Prime Self | The user's five-year future self. The user sets a target year (default sign-up year plus five). |
| Pillars | Health, Purpose, Relationships, Identity. Fixed names in V1. |
| North Star | The user's written description of his Prime Self per pillar, plus lifestyle and "Your Moment". |
| Non-negotiables | Three standing daily commitments, each mapped to a pillar score item. |
| The One Thing | The single thing the user commits to finishing today. |
| Prime Score | Daily score 0 to 100, computed from the evening check-in. |
| Prime Trajectory | 28-day rolling average of Prime Score, with per-pillar bars and a direction indicator. |
| Old pattern | A recurring unwanted behaviour from the library. Appearances are logged, never "failures". |
| Replacement behaviour | The concrete action that replaces an old pattern. |
| IF-THEN plan | An implementation intention attached to a pattern. |
| Courage Rep | A logged act of action despite discomfort. |
| Return Rate | Share of missed non-negotiables recovered the next day. |
| Finish Ratio | Projects finished divided by projects started, over 90 days. |
| Founding member | One of the first 100 accounts. Free forever. |

## 5. Scope summary

V1 includes: accounts and lifecycle, legal pages, marketing consent and Mailchimp hook, Founding 100, onboarding wizard, Today, morning and evening check-ins, Prime Score and Trajectory, health in two modes with trends, pattern library with five in focus, replacement behaviours and IF-THEN plans, habit stacks, Courage Reps, I'm Stuck, Idea Parking Lot with promotion filter, projects with active limit and Finish Ratio, relationships with cadence, weekly review, 90-day cycle, Vision with Your Moment, progress dashboard, settings, admin view, PWA install, documentation.

V2: business dashboard, content and audience metrics, Freedom Score, Financial North Star, push notifications, billing.

V3: AI coach, correlation insights, Garmin, Everfit, Apple Health, calendar.

## 6. Feature requirements

Each feature lists behaviour, then acceptance criteria (AC).

### 6.1 Accounts

Behaviour: email and password sign-up, or magic link. Email verification required before the app opens. Separate, unticked marketing-consent checkbox at sign-up. Password reset. Sign out. Delete account (hard delete of all user rows after a typed confirmation). Export my data (JSON download of every row the user owns).

Founding 100: the first 100 verified accounts receive `plan = founding` and a `founding_number` 1 to 100, assigned atomically at verification. Accounts after that receive `plan = early_access`. The plan is shown on the profile screen. Founding number is shown in-app only.

Mailchimp: when consent is given, the server adds the email, first name and tag `prime60-app` to the configured audience. If no API key is configured, the consent is stored and nothing is sent. Consent can be withdrawn in settings, which removes the Mailchimp tag.

AC: a user can sign up, verify, sign in, reset password and delete the account on an iPhone without help. Two users cannot see each other's data, proven by automated RLS tests. Founding numbers are unique and never exceed 100.

### 6.2 Onboarding

Behaviour: a resumable wizard of nine short steps, each one screen, each with a worked example drawn from Colin's own answers. Progress is saved per step. The wizard can be left and resumed. Total target time ten minutes.

Steps:
1. Welcome and target year. "In [year] you will be [age]. Who is he?"
2. Health North Star. One paragraph, dictation-friendly, with an example.
3. Purpose North Star. Same.
4. Relationships North Star. Same.
5. Lifestyle and Your Moment. Optional. Example is the Amalfi scene.
6. Old patterns. Pick five from the library of fifteen. Each pick shows its default replacement behaviour and IF-THEN plan, editable.
7. People. Add partner, children, family, friends with a cadence per group. Partner cadence defaults to daily, children and family weekly, friends fortnightly, community monthly.
8. Non-negotiables. Pick three from the catalogue or write a custom one with a pillar. Defaults offered: Train, Publish, Connect.
9. Identity statement and health mode. One identity statement from examples or custom. Health mode: "Track here" or "I'm coached elsewhere". Optional Skool link shown at the end.

AC: a new user completes onboarding in under twelve minutes on an iPhone and lands on Today with real content. Leaving at step 5 and returning resumes at step 5.

### 6.3 Today

Behaviour: the daily operating screen. In order: date and a short greeting line; Prime Trajectory with four pillar bars and direction; three non-negotiables as large tap targets that record completion immediately; The One Thing with a finish control; today's Courage Rep intention and today's person, each tappable to record done; I'm Stuck button, always visible. If the morning check-in has not been done, Today shows a single prompt to start it. If the evening check-in is open (after a configurable hour, default 6 pm) a prompt appears.

Taps on Today write the same fields the evening check-in reads, so the evening is confirmation, not re-entry.

AC: the user understands the day within five seconds. Every control is at least 44 by 44 points. The screen fits an iPhone 13 viewport without scrolling for the first five elements.

### 6.4 Morning check-in

Behaviour: target one to two minutes. Screen 1: "Who am I becoming?" with the user's identity statement. Screen 2: non-negotiables pre-filled from standing choices, with an override. Screen 3: The One Thing, free text or pick from an active project's next action. Screen 4: optional Courage Rep intention from a list and one person from the user's people. "Same as yesterday" on screen 2 keeps non-negotiables and jumps to screen 3.

AC: the common path is four taps and one line of text.

### 6.5 Evening check-in

Behaviour: target two to three minutes. One scrolling screen grouped by pillar, every item a tap or a 1 to 10 selector, pre-filled from anything recorded during the day. Ends with the Prime Score revealed with its breakdown and a one-line reinforcement. Optional closing line "Today I became my Prime Self by ______".

Items are defined in section 7.

AC: a complete score is produced with zero typing. The breakdown explains every point.

### 6.6 Prime Score and Trajectory

Defined in section 7.

### 6.7 Health

Behaviour: two modes chosen in onboarding and changeable in settings.

Track here: daily optional fields, each hideable: sleep hours, sleep quality, energy, training performance, steps, weight, body fat, waist, calories, protein, notes. Only trained, moved and energy affect the score.

Coached elsewhere: daily items reduce to trained, logged with coach, energy. Weekly weigh-in prompt on a chosen day for weight and body fat.

Both modes: targets for weight and body fat with direction-aware progress. Programme targets per week: resistance sessions, cardio sessions, steps per day, editable at any time. Trend charts for weight, body fat, waist, energy, training consistency over 7, 30, 90, 365 days and all time. Health consistency equals the 28-day mean of the health pillar.

AC: Colin's starting point (69.5 kg to 77 kg) shows progress increasing as weight rises. No field is required.

### 6.8 Behaviour engine

Pattern library: fifteen defaults, admin-editable, each with name, generic description, default replacement behaviour, default IF-THEN plan, and a two-minute start. User picks five in focus; the rest are available but not shown on the quick sheet.

Quick log: from any screen via the action sheet, two taps: pattern name, then "Followed it" or "Did the replacement". Optional expansion captures cue, desire, old response, immediate reward, long-term cost, Prime response, action taken, lesson. Nothing is required.

Habit stacks: "After [anchor] I will [behaviour]" with up to eight stacks, shown on Today as a collapsible list.

Courage Reps: one tap from the action sheet, pick a type from the list or custom. Reinforcement line: "Courage Rep recorded. A vote for your Prime Self."

I'm Stuck: full-screen simplified flow. What are you avoiding (one line). Why (nine options). Smallest meaningful action (one line). "What would your Prime Self do?" (one line, optional). Then a 15-minute timer with pause. On completion: Did you move forward? Yes records a Courage Rep. Partly asks for the next action. No asks for a smaller action and offers a two-minute start.

Idea Parking Lot: capture is one line and one tap. Ideas list shows parked ideas with age. Promote to project opens the six-question filter and a decision: Pursue, Review in 30 days, Park, Kill. Pursue opens project creation, which may trigger the active limit dialog.

AC: a pattern can be logged in under five seconds. I'm Stuck works with the screen locked and the timer continues in the background.

### 6.9 Projects and Finish Ratio

Project fields: name, pillar, started date, definition of done, target date, next action, status, notes. Statuses: idea, active, blocked, paused, finished, killed. Status changes are recorded with a timestamp.

Active limit: default three, configurable one to six. Moving a project to active beyond the limit shows "You already have N active priorities. What will this replace?" with Finish one first, Pause one, Kill one, Park this, Override. Override is recorded.

Finish Ratio: counts at 30 days, ratio at 90 days, ratio hidden when fewer than three starts in the window. The old loop and the new loop are shown on the projects screen as a quiet reminder.

AC: the dialog appears on the fourth active project. Finish Ratio never shows a misleading value.

### 6.10 Relationships

People belong to a group: Partner, Children, Family, Friends, Community. Groups are renameable. Each person has a cadence. Daily "Connected today?" per person is one tap. Interaction types: meaningful contact, quality time, support, important conversation, gratitude, note. Partner has optional connection 1 to 10.

Drift is shown as a soft indicator when the cadence has lapsed by more than one period, worded "It has been a while since you and Olivia connected", never as overdue. Weekly question in the review: "Did the people I love feel important to me this week, or merely know that they're important?"

AC: nothing on the relationships screen resembles a sales pipeline.

### 6.11 Weekly review

Behaviour: available from Sunday, prompted on Today. Six sections pre-filled with the week's numbers, each with one or two reflective questions. Section E includes rotating the five patterns in focus. Section F sets next week's priority, one thing to finish and three non-negotiables. Target ten to fifteen minutes. Partial completion saves.

AC: every number shown is explainable by tapping it.

### 6.12 90-day cycle

Behaviour: one active cycle at a time. Up to six objectives with guideline limits per pillar. Fields: outcome, why, starting point, metric, target, leading indicator, next action, status. End-of-cycle decision per objective: Continue, Adapt, Stop, Scale. The roadmap view shows Today, 90 days, 12 months, 3 years, 5 years with the user's own entries.

### 6.13 Vision

Behaviour: a scrolling, image-ready screen with the user's North Star per pillar, lifestyle, and Your Moment at the end, followed by the primary quote and the question "Is today's behaviour worthy of that future?" Images are optional uploads in V1 with tasteful defaults.

### 6.14 Progress

Behaviour: trends that answer a question. Prime Trajectory over time; pillar consistency; old pattern appearances down; Courage Reps up; Return Rate; Finish Ratio; visible days; relationship consistency; health consistency. Periods: 7, 30, 90, 365, all time.

### 6.15 Settings

Non-negotiables, identity statements, health mode and fields, programme targets, patterns in focus, active project limit, evening check-in hour, weigh-in day, theme (system, light, dark), marketing consent, Skool link, export data, delete account.

### 6.16 Admin

Admin-only screen: total users, verified users, active in the last 7 and 28 days, sign-ups per week, founding count, CSV export of consented emails, and an editor for the pattern library, non-negotiable catalogue, Courage Rep types, identity statement examples and weekly review questions.

### 6.17 PWA

Installable with manifest and icons, standalone display, offline shell that shows the last loaded Today and queues writes for retry. An "Install on iPhone" page with three screenshots.

## 7. Scoring specification

### 7.1 Daily items

All items are recorded for a calendar day in the user's timezone. Weights sum to 100.

Health (30)
- H1 Trained today: 15
- H2 Moved (steps target or active movement) in track mode, or Logged with coach in coached mode: 7
- H3 Energy 1 to 10: scaled to 0 to 8 (energy times 0.8, rounded)

Identity (30)
- I1 Finished The One Thing: 12
- I2 Courage Rep recorded today: 8
- I3 Patterns handled: 10 if no pattern appeared or every appearance was met with the replacement; 5 if mixed; 0 if every appearance followed the old response

Relationships (20)
- R1 Connected with today's person (or any person if none was chosen): 12
- R2 Quality time with partner, or with someone who matters if no partner: 8

Purpose (20)
- P1 Published or shipped something visible: 10
- P2 Moved the main project forward: 6
- P3 Served a client, community member or had a target-market conversation: 4

Non-negotiables map to items: Train to H1, Publish to P1, Connect to R1. Custom non-negotiables map to the first item of their pillar. Completing a non-negotiable on Today sets the item.

### 7.2 Derived numbers

- Pillar percent for a day: pillar points divided by pillar weight.
- Prime Score: sum of points. Shown with the breakdown.
- Prime Trajectory: mean Prime Score over the last 28 days with an evening check-in. Days without a check-in are excluded, and the count of unlogged days is shown. Fewer than 3 logged days shows "Building" instead of a number.
- Trajectory direction: mean of the last 14 logged days minus the mean of the 14 before. Up if at least +3, down if at most −3, otherwise steady.
- Pillar consistency: mean pillar percent over the same window. Health consistency and relationship consistency are these numbers.
- Return Rate: over 90 days, for each non-negotiable, a day it was not completed is a miss. A miss followed by completion the next day is a recovery. Return Rate is recoveries divided by misses, shown when misses are at least 3.
- Finish Ratio: projects set to finished in the window divided by projects set to active in the window. Shown at 90 days when starts are at least 3. Counts shown at 30 days always.
- Visible days: days with P1 true, as a count per window.

### 7.3 Language

Score reveal lines by band: 85 and above "A Prime Self day."; 70 to 84 "Solid. The man is being built."; 50 to 69 "Mixed day. Return tomorrow."; below 50 "A reset day. One miss is an event. Return tomorrow." Never any of the banned words.

## 8. Non-functional requirements

- Performance: Today loads in under 1.5 seconds on 4G from cache. Writes feel instant with optimistic UI.
- Mobile: iPhone 13 and 15 viewports primary, Android Chrome secondary, desktop responsive.
- Accessibility: WCAG 2.2 AA contrast, 44pt targets, visible focus, reduced motion respected, screen-reader labels on every control.
- Security: Supabase Auth, Row Level Security on every table, service-role key only on the server, secrets in environment variables, input validation on every write, rate limiting on auth endpoints.
- Privacy: health and relationship data never leave Supabase except in the user's own export. Mailchimp receives email and first name only. Privacy policy and terms published before launch.
- Reliability: daily automated Supabase backups (Pro plan). Migrations are versioned and repeatable.
- Observability: server error logging; no third-party analytics in V1.

## 9. Success measures

- Colin uses it morning and evening at least 6 days in 7 for four consecutive weeks.
- Median morning check-in under 2 minutes, evening under 3 minutes, measured from screen open to save.
- 100 founding members within 60 days of launch.
- 40% of sign-ups still active (any check-in) at day 28.

## 10. Out of scope for V1

Payments, push notifications, integrations, AI coaching, multi-language, team or coach views, public profiles, social features.
