# Prime 60 — Information Architecture and Routes

## 1. Primary navigation (bottom tab bar, five destinations)

| Tab | Job | Answers |
| --- | --- | --- |
| Today | Daily operating screen | What matters now? What do I do next? |
| Progress | Trends across pillars, health, identity, relationships | Where am I? |
| Plan | Projects, Idea Parking Lot, 90-day cycle, roadmap | What matters now? |
| Vision | North Star, Your Moment | Why? |
| More | Settings, people, patterns, account, guide, admin | Configuration |

A floating action control on Today, Progress and Plan opens the **action sheet**: Log a pattern, Courage Rep, Park an idea, Connected with someone, Health note. I'm Stuck is a dedicated button on Today, not in the sheet.

Check-ins are flows launched from Today, not tabs.

## 2. Screen inventory

### Public
- `/` landing (short; the real landing page lives on colindesilva.com/prime60)
- `/sign-up`, `/sign-in`, `/magic-link`, `/reset-password`, `/verify` (post-verification landing)
- `/privacy`, `/terms`, `/install` (install on iPhone guide)

### Onboarding (authenticated, incomplete profile)
- `/welcome/[step]` steps 1 to 9, resumable

### App (authenticated, onboarded)
- `/today`
- `/today/morning` (4 screens, one route with step state)
- `/today/evening` (one scrolling screen plus score reveal)
- `/today/stuck` (full-screen flow)
- `/today/review` (weekly review, available from Sunday)
- `/progress` with segmented view: Overview, Health, Identity, Relationships
- `/progress/health/log` (track-here fields or weekly weigh-in)
- `/plan` with segmented view: Projects, Ideas, 90 Days, Roadmap
- `/plan/projects/new`, `/plan/projects/[id]`
- `/plan/ideas/[id]` (promotion filter)
- `/plan/cycle` (current cycle), `/plan/cycle/objectives/[id]`
- `/vision` (one scrolling screen), `/vision/edit`
- `/more` index
- `/more/people`, `/more/people/[id]`
- `/more/patterns` (library, five in focus, edit replacements and IF-THEN)
- `/more/habit-stacks`
- `/more/non-negotiables`
- `/more/identity`
- `/more/health` (mode, fields, targets, programme)
- `/more/account` (profile, plan, consent, export, delete)
- `/more/guide` (in-app user guide)
- `/more/admin` (admin only) with sub-views: Users, Content

### Sheets and dialogs (no route)
- Action sheet
- Pattern quick log (two taps) with "Add detail" expansion
- Courage Rep log
- Park an idea
- Connected with someone
- Active project limit dialog
- Score breakdown
- Explain this number (used across Progress)

## 3. Content model (what the admin edits)

- Pattern library (15 defaults)
- Non-negotiable catalogue (Train, Publish, Connect, Walk, Meditate, Review priorities, Write, Record, No alcohol, In bed by, custom)
- Courage Rep types (10 defaults from the brief)
- Identity statement examples
- Onboarding worked examples (Colin's)
- Weekly review questions by section
- Score reveal lines by band
- "Why" options for I'm Stuck

## 4. Key user flows

### 4.1 Sign up to first Today
Sign up → verification email → tap link → `/verify` assigns founding number if available → `/welcome/1` → … → `/welcome/9` → `/today` with the morning prompt.

### 4.2 Morning
Today shows "Start the morning" → identity statement → non-negotiables (Same as yesterday skips) → The One Thing (type, or pick a project's next action) → optional Courage Rep intention and today's person → back to Today, fully populated.

### 4.3 During the day
Any tab → action sheet → Log a pattern → pick one of five in focus → Followed it / Did the replacement → confirmation line → optional Add detail. Same shape for Courage Rep, Park an idea, Connected with someone.

Today → I'm Stuck → avoiding → why → smallest action → Prime Self question → 15:00 timer → Did you move forward? → Yes records Courage Rep; Partly asks next action; No shrinks the action and offers a two-minute start.

Today → tap a non-negotiable → marked done with a subtle confirmation → evening pre-filled.

### 4.4 Evening
Today shows "Close the day" after the evening hour → one scrolling screen by pillar, pre-filled → Reveal score → number and bars animate once → breakdown available → optional closing line → back to Today showing the score.

### 4.5 Project limit
Plan → Projects → New project → status Active → if active count equals limit: dialog with Finish one first, Pause one, Kill one, Park this, Override → chosen action applied → project saved.

### 4.6 Idea promotion
Plan → Ideas → an idea → Consider pursuing → six questions, each a short answer or a tap → decision Pursue, Review in 30 days, Park, Kill → Pursue creates a project (may trigger 4.5).

### 4.7 Weekly review
Sunday prompt on Today → sections A to F, each pre-filled with numbers and one or two questions → section E rotates patterns in focus → section F sets next week → done → Today shows next week's priority.

### 4.8 Weigh-in (coached mode)
On weigh-in day Today shows a one-line prompt → weight and body fat → saved → progress toward target updated.

### 4.9 Account deletion
More → Account → Delete account → explanation → type DELETE → auth user deleted → cascade removes all rows → signed out to `/`.

## 5. Information hierarchy on Today

1. Date and greeting (small)
2. Prime Trajectory: number, direction, four pillar bars (one glance)
3. Three non-negotiables (large taps)
4. The One Thing (prominent, with finish control)
5. Courage Rep intention and today's person (two compact rows)
6. Habit stacks (collapsed)
7. I'm Stuck (fixed above the tab bar)

Prompts (morning, evening, weigh-in, weekly review) appear as a single banner between 1 and 2, never more than one at a time, in priority order: morning, evening, weekly review, weigh-in.
