# Prime 60 — Data Model and Row Level Security

Postgres on Supabase. Conventions: lowercase snake_case identifiers; `bigint generated always as identity` primary keys for all user data; `timestamptz` everywhere; `text` with check constraints instead of enums (easier to evolve); every user-owned table has `user_id uuid not null references auth.users(id) on delete cascade` and an index led by `user_id`; RLS enabled and forced on every table; policies use `(select auth.uid())`.

Two schemas: `public` for application tables, `private` for security-definer helpers that must not be exposed through the API.

## 1. Identity and account

### profiles
One row per auth user, created by a trigger on `auth.users` insert.

| column | type | notes |
| --- | --- | --- |
| user_id | uuid pk | references auth.users on delete cascade |
| first_name | text | |
| timezone | text not null default 'Australia/Brisbane' | IANA |
| target_year | int | Prime Self year |
| birth_year | int | optional, for "you will be N" |
| plan | text not null default 'early_access' | check in ('founding','early_access','paid') |
| founding_number | int unique | 1 to 100, null otherwise |
| is_admin | boolean not null default false | |
| marketing_consent | boolean not null default false | |
| marketing_consent_at | timestamptz | |
| mailchimp_synced_at | timestamptz | |
| health_mode | text not null default 'track' | check in ('track','coached') |
| evening_hour | int not null default 18 | 0 to 23 |
| weigh_in_dow | int not null default 1 | 0 Sunday to 6 Saturday |
| active_project_limit | int not null default 3 | check 1 to 6 |
| theme | text not null default 'system' | check in ('system','light','dark') |
| onboarding_step | int not null default 1 | 1 to 9, 10 means complete |
| onboarding_completed_at | timestamptz | |
| skool_link_seen_at | timestamptz | |
| created_at, updated_at | timestamptz | |

### founding_counter
Single row: `id int pk check (id = 1)`, `claimed int not null default 0`. Founding numbers are claimed by `update founding_counter set claimed = claimed + 1 where id = 1 and claimed < 100 returning claimed`, executed by a security-definer function called from the verification trigger. Row-level lock guarantees uniqueness under concurrency.

## 2. Vision and identity

### north_stars
`id`, `user_id`, `section text check in ('health','purpose','relationships','identity','lifestyle','moment')`, `body text`, `updated_at`. Unique `(user_id, section)`.

### identity_statements
`id`, `user_id`, `body text not null`, `is_primary boolean default false`, `created_at`. Partial unique index on `(user_id) where is_primary`.

### roadmap_items
`id`, `user_id`, `horizon text check in ('90d','1y','3y','5y')`, `body text`, `sort_order int`.

### vision_images
`id`, `user_id`, `section text`, `storage_path text`, `created_at`. Storage bucket `vision` with per-user folder policy.

## 3. Daily loop

### non_negotiables
Standing commitments. `id`, `user_id`, `label text`, `pillar text check in ('health','identity','relationships','purpose')`, `score_key text check in ('h1','h2','i1','i2','r1','r2','p1','p2','p3')`, `sort_order int`, `is_active boolean default true`. At most three active enforced in application code and by a partial unique index on `(user_id, sort_order) where is_active` with sort_order check 1 to 3.

### daily_entries
One row per user per local date. Holds morning intent, evening evidence and the computed score.

| column | type |
| --- | --- |
| id | bigint identity pk |
| user_id | uuid |
| entry_date | date |
| morning_done_at | timestamptz |
| one_thing | text |
| one_thing_project_id | bigint references projects |
| courage_intent_type_id | bigint references courage_rep_types |
| person_id | bigint references people |
| trained | boolean |
| moved | boolean |
| logged_with_coach | boolean |
| energy | int check 1 to 10 |
| finished_one_thing | boolean |
| connected | boolean |
| quality_time | boolean |
| published | boolean |
| moved_project | boolean |
| served | boolean |
| closing_line | text |
| evening_done_at | timestamptz |
| score | int check 0 to 100 |
| score_health, score_identity, score_relationships, score_purpose | int |
| score_breakdown | jsonb |
| created_at, updated_at | timestamptz |

Unique `(user_id, entry_date)`. Index `(user_id, entry_date desc)`.

### daily_commitments
Completion of each non-negotiable per day. `id`, `user_id`, `entry_date date`, `non_negotiable_id bigint`, `completed boolean default false`, `completed_at timestamptz`. Unique `(user_id, entry_date, non_negotiable_id)`. Return Rate is computed from this table.

## 4. Behaviour engine

### pattern_library (content, global)
`id`, `slug text unique`, `name text`, `description text`, `replacement text`, `if_then text`, `two_minute_start text`, `sort_order int`, `is_active boolean`.

### user_patterns
`id`, `user_id`, `pattern_id bigint references pattern_library`, `in_focus boolean default false`, `replacement_override text`, `if_then_override text`, `created_at`. Unique `(user_id, pattern_id)`. At most five in focus enforced in application code.

### pattern_occurrences
`id`, `user_id`, `user_pattern_id bigint`, `occurred_on date`, `occurred_at timestamptz default now()`, `response text check in ('followed','replaced')`, `cue`, `desire`, `old_response`, `immediate_reward`, `long_term_cost`, `prime_response`, `action_taken`, `lesson` (all text, nullable). Index `(user_id, occurred_on desc)`.

### courage_rep_types (content, global)
`id`, `slug`, `label`, `sort_order`, `is_active`.

### courage_reps
`id`, `user_id`, `occurred_on date`, `occurred_at timestamptz`, `type_id bigint references courage_rep_types`, `custom_label text`, `note text`, `source text check in ('manual','stuck')`. Index `(user_id, occurred_on desc)`.

### habit_stacks
`id`, `user_id`, `anchor text`, `behaviour text`, `sort_order int`, `is_active boolean`.

### stuck_sessions
`id`, `user_id`, `started_at`, `avoiding text`, `why text check in ('fear','uncertainty','complexity','boredom','perfectionism','rejection','difficult_conversation','dont_know_where_to_begin','other')`, `smallest_action text`, `prime_self_would text`, `timer_seconds int default 900`, `completed_at timestamptz`, `outcome text check in ('yes','partly','no')`, `next_action text`, `courage_rep_id bigint references courage_reps`.

### ideas
`id`, `user_id`, `title text`, `note text`, `captured_at timestamptz`, `decision text check in ('pursue','review_30','park','kill')`, `decided_at timestamptz`, `review_on date`, `filter_answers jsonb`, `project_id bigint references projects`. Index `(user_id, captured_at desc)`.

## 5. Projects

### projects
`id`, `user_id`, `name text`, `pillar text`, `definition_of_done text`, `started_on date`, `target_on date`, `finished_on date`, `next_action text`, `status text check in ('idea','active','blocked','paused','finished','killed')`, `notes text`, `idea_id bigint`, `limit_overridden boolean default false`, `created_at`, `updated_at`. Index `(user_id, status)`.

### project_status_history
`id`, `user_id`, `project_id bigint references projects on delete cascade`, `from_status text`, `to_status text`, `changed_at timestamptz default now()`, `note text`. Finish Ratio is computed from this table: starts are transitions to `active`, finishes are transitions to `finished`.

## 6. Relationships

### people_groups
`id`, `user_id`, `key text check in ('partner','children','family','friends','community')`, `label text`, `default_cadence_days int`, `sort_order int`. Unique `(user_id, key)`. Seeded at onboarding.

### people
`id`, `user_id`, `group_id bigint references people_groups`, `name text`, `cadence_days int`, `is_active boolean default true`, `created_at`.

### interactions
`id`, `user_id`, `person_id bigint references people on delete cascade`, `occurred_on date`, `kind text check in ('contact','quality_time','support','conversation','gratitude','note')`, `connection_rating int check 1 to 10`, `note text`, `created_at`. Index `(user_id, person_id, occurred_on desc)`.

## 7. Health

### health_targets
One row per user. `user_id pk`, `starting_weight numeric(5,2)`, `starting_body_fat numeric(4,1)`, `target_weight numeric(5,2)`, `target_body_fat_low numeric(4,1)`, `target_body_fat_high numeric(4,1)`, `resistance_per_week int`, `cardio_per_week int`, `cardio_calories_per_session int`, `steps_per_day int`, `hidden_fields text[] default '{}'`, `updated_at`.

### health_metrics
`id`, `user_id`, `metric_date date`, `weight numeric(5,2)`, `body_fat numeric(4,1)`, `waist numeric(5,1)`, `sleep_hours numeric(3,1)`, `sleep_quality int`, `training_performance int`, `steps int`, `calories int`, `protein int`, `cardio_calories int`, `notes text`, `created_at`, `updated_at`. Unique `(user_id, metric_date)`.

## 8. Reviews and cycles

### review_questions (content, global)
`id`, `section text check in ('a','b','c','d','e','f')`, `slug text unique`, `prompt text`, `sort_order int`, `is_active boolean`.

### weekly_reviews
`id`, `user_id`, `week_start date` (Monday), `snapshot jsonb` (the numbers shown, frozen), `answers jsonb` (slug to text), `next_priority text`, `next_one_thing text`, `completed_at timestamptz`, `created_at`, `updated_at`. Unique `(user_id, week_start)`.

### cycles
`id`, `user_id`, `starts_on date`, `ends_on date`, `status text check in ('active','closed')`, `closing_notes text`. Partial unique `(user_id) where status = 'active'`.

### objectives
`id`, `user_id`, `cycle_id bigint references cycles on delete cascade`, `pillar text`, `outcome text`, `why text`, `starting_point text`, `metric text`, `target text`, `leading_indicator text`, `next_action text`, `status text check in ('on_track','at_risk','done','stopped')`, `end_decision text check in ('continue','adapt','stop','scale')`, `sort_order int`.

## 9. Content tables (global)

`pattern_library`, `courage_rep_types`, `review_questions`, plus:

### non_negotiable_catalogue
`id`, `label`, `pillar`, `score_key`, `sort_order`, `is_active`.

### content_snippets
Key-value for worked examples, score reveal lines, identity examples, stuck "why" labels. `id`, `key text unique`, `body text`, `updated_at`.

## 10. Row Level Security

Every table: `enable row level security` and `force row level security`.

User-owned tables (all tables with `user_id`): one policy per command, `to authenticated`, `using (user_id = (select auth.uid()))` and `with check (user_id = (select auth.uid()))`. `profiles` uses `user_id` the same way.

Content tables: `select` to `authenticated` where `is_active`; `insert`, `update`, `delete` require `(select private.is_admin())`.

`private.is_admin()` is `security definer`, `set search_path = ''`, returns `exists (select 1 from public.profiles where user_id = (select auth.uid()) and is_admin)`. Execute revoked from `anon`; granted to `authenticated` only because policies evaluate it as the caller.

`anon` role has no access to any table. Public pages read nothing from the database.

`founding_counter`: no policies for any role. Only `private.claim_founding_number()` (security definer) touches it, called from `private.handle_user_verified()` trigger on `auth.users` when `email_confirmed_at` transitions from null.

Storage bucket `vision`: path must start with the user's id.

## 11. Server-side computation

Prime Score, Trajectory, Return Rate and Finish Ratio are computed in TypeScript in `lib/scoring` with unit tests, and the daily score is persisted into `daily_entries` on evening save. Window aggregates are computed by SQL views for speed:

- `v_daily_scores`: per user per date, score and pillar scores.
- `v_commitment_days`: per user, per non-negotiable, per date, completed.

Views are `security_invoker = true` so RLS applies.

## 12. Deletion and export

Deleting the auth user cascades through every table. Export is a server route that selects every user-owned table for the caller and returns one JSON file.

## 13. Indexes (summary)

Every `user_id` foreign key is indexed. Date-led composites on `daily_entries`, `daily_commitments`, `pattern_occurrences`, `courage_reps`, `interactions`, `health_metrics`. Status composite on `projects`. Foreign keys to parent rows (`person_id`, `project_id`, `cycle_id`, `user_pattern_id`) are indexed.
