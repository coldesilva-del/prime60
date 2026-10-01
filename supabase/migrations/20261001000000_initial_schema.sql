-- Prime 60 initial schema. See docs/04-data-model.md.
-- Conventions: bigint identity keys, timestamptz, text + check instead of enums,
-- every user table owned by user_id -> auth.users, RLS enabled and forced.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and is_admin
  );
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  timezone text not null default 'Australia/Brisbane',
  target_year int,
  birth_year int,
  plan text not null default 'early_access' check (plan in ('founding','early_access','paid')),
  founding_number int unique check (founding_number between 1 and 100),
  is_admin boolean not null default false,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  mailchimp_synced_at timestamptz,
  health_mode text not null default 'track' check (health_mode in ('track','coached')),
  evening_hour int not null default 18 check (evening_hour between 0 and 23),
  weigh_in_dow int not null default 1 check (weigh_in_dow between 0 and 6),
  active_project_limit int not null default 3 check (active_project_limit between 1 and 6),
  theme text not null default 'system' check (theme in ('system','light','dark')),
  onboarding_step int not null default 1 check (onboarding_step between 1 and 10),
  onboarding_completed_at timestamptz,
  skool_link_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Create a profile row for every new auth user. Marketing consent and first
-- name arrive in raw_user_meta_data from the sign-up form; they are copied once
-- here and never used for authorisation.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, first_name, marketing_consent, marketing_consent_at)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), ''),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false) then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Founding 100
-- ---------------------------------------------------------------------------

create table public.founding_counter (
  id int primary key check (id = 1),
  claimed int not null default 0 check (claimed between 0 and 100)
);
insert into public.founding_counter (id, claimed) values (1, 0);
alter table public.founding_counter enable row level security;
alter table public.founding_counter force row level security;
revoke all on public.founding_counter from public, anon, authenticated;

create or replace function private.claim_founding_number()
returns int
language sql
security definer
set search_path = ''
as $$
  update public.founding_counter
  set claimed = claimed + 1
  where id = 1 and claimed < 100
  returning claimed;
$$;
revoke execute on function private.claim_founding_number() from public, anon, authenticated;

-- When a user's email is confirmed, claim a founding number if any remain.
create or replace function private.handle_user_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    select private.claim_founding_number() into n;
    if n is not null then
      update public.profiles
      set plan = 'founding', founding_number = n
      where user_id = new.id and founding_number is null;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_verified
  after update of email_confirmed_at on auth.users
  for each row execute function private.handle_user_verified();

-- ---------------------------------------------------------------------------
-- Content tables (global, admin-edited)
-- ---------------------------------------------------------------------------

create table public.pattern_library (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  replacement text not null,
  if_then text not null,
  two_minute_start text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.courage_rep_types (
  id bigint generated always as identity primary key,
  slug text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.non_negotiable_catalogue (
  id bigint generated always as identity primary key,
  slug text not null unique,
  label text not null,
  pillar text not null check (pillar in ('health','identity','relationships','purpose')),
  score_key text not null check (score_key in ('h1','h2','i1','i2','r1','r2','p1','p2','p3')),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.review_questions (
  id bigint generated always as identity primary key,
  section text not null check (section in ('a','b','c','d','e','f')),
  slug text not null unique,
  prompt text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.content_snippets (
  id bigint generated always as identity primary key,
  key text not null unique,
  body text not null,
  updated_at timestamptz not null default now()
);
create trigger content_snippets_updated_at before update on public.content_snippets
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vision and identity
-- ---------------------------------------------------------------------------

create table public.north_stars (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('health','purpose','relationships','identity','lifestyle','moment')),
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, section)
);
create trigger north_stars_updated_at before update on public.north_stars
  for each row execute function private.set_updated_at();

create table public.identity_statements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index identity_statements_user_idx on public.identity_statements (user_id);
create unique index identity_statements_primary_idx on public.identity_statements (user_id) where is_primary;

create table public.roadmap_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  horizon text not null check (horizon in ('90d','1y','3y','5y')),
  body text not null,
  sort_order int not null default 0
);
create index roadmap_items_user_idx on public.roadmap_items (user_id, horizon);

create table public.vision_images (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index vision_images_user_idx on public.vision_images (user_id);

-- ---------------------------------------------------------------------------
-- Projects (before daily_entries, which references them)
-- ---------------------------------------------------------------------------

create table public.projects (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  pillar text not null check (pillar in ('health','identity','relationships','purpose')),
  definition_of_done text,
  started_on date,
  target_on date,
  finished_on date,
  next_action text,
  status text not null default 'idea' check (status in ('idea','active','blocked','paused','finished','killed')),
  notes text,
  idea_id bigint,
  limit_overridden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_status_idx on public.projects (user_id, status);
create trigger projects_updated_at before update on public.projects
  for each row execute function private.set_updated_at();

create table public.project_status_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  note text
);
create index project_status_history_user_idx on public.project_status_history (user_id, changed_at desc);
create index project_status_history_project_idx on public.project_status_history (project_id);

-- ---------------------------------------------------------------------------
-- Relationships
-- ---------------------------------------------------------------------------

create table public.people_groups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('partner','children','family','friends','community')),
  label text not null,
  default_cadence_days int not null default 7,
  sort_order int not null default 0,
  unique (user_id, key)
);
create index people_groups_user_idx on public.people_groups (user_id);

create table public.people (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id bigint not null references public.people_groups(id) on delete cascade,
  name text not null,
  cadence_days int not null default 7 check (cadence_days between 1 and 365),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index people_user_idx on public.people (user_id);
create index people_group_idx on public.people (group_id);

create table public.interactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id bigint not null references public.people(id) on delete cascade,
  occurred_on date not null,
  kind text not null check (kind in ('contact','quality_time','support','conversation','gratitude','note')),
  connection_rating int check (connection_rating between 1 and 10),
  note text,
  created_at timestamptz not null default now()
);
create index interactions_user_person_idx on public.interactions (user_id, person_id, occurred_on desc);
create index interactions_user_date_idx on public.interactions (user_id, occurred_on desc);

-- ---------------------------------------------------------------------------
-- Daily loop
-- ---------------------------------------------------------------------------

create table public.non_negotiables (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  pillar text not null check (pillar in ('health','identity','relationships','purpose')),
  score_key text not null check (score_key in ('h1','h2','i1','i2','r1','r2','p1','p2','p3')),
  sort_order int not null default 1 check (sort_order between 1 and 3),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index non_negotiables_user_idx on public.non_negotiables (user_id);
create unique index non_negotiables_active_slot_idx on public.non_negotiables (user_id, sort_order) where is_active;

create table public.daily_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  morning_done_at timestamptz,
  one_thing text,
  one_thing_project_id bigint references public.projects(id) on delete set null,
  courage_intent_type_id bigint references public.courage_rep_types(id) on delete set null,
  person_id bigint references public.people(id) on delete set null,
  trained boolean,
  moved boolean,
  logged_with_coach boolean,
  energy int check (energy between 1 and 10),
  finished_one_thing boolean,
  connected boolean,
  quality_time boolean,
  published boolean,
  moved_project boolean,
  served boolean,
  closing_line text,
  evening_done_at timestamptz,
  score int check (score between 0 and 100),
  score_health int,
  score_identity int,
  score_relationships int,
  score_purpose int,
  score_breakdown jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index daily_entries_user_date_idx on public.daily_entries (user_id, entry_date desc);
create index daily_entries_project_idx on public.daily_entries (one_thing_project_id);
create index daily_entries_person_idx on public.daily_entries (person_id);
create trigger daily_entries_updated_at before update on public.daily_entries
  for each row execute function private.set_updated_at();

create table public.daily_commitments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  non_negotiable_id bigint not null references public.non_negotiables(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, entry_date, non_negotiable_id)
);
create index daily_commitments_user_date_idx on public.daily_commitments (user_id, entry_date desc);
create index daily_commitments_nn_idx on public.daily_commitments (non_negotiable_id);

-- ---------------------------------------------------------------------------
-- Behaviour engine
-- ---------------------------------------------------------------------------

create table public.user_patterns (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id bigint not null references public.pattern_library(id) on delete cascade,
  in_focus boolean not null default false,
  replacement_override text,
  if_then_override text,
  created_at timestamptz not null default now(),
  unique (user_id, pattern_id)
);
create index user_patterns_user_idx on public.user_patterns (user_id);
create index user_patterns_pattern_idx on public.user_patterns (pattern_id);

create table public.pattern_occurrences (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_pattern_id bigint not null references public.user_patterns(id) on delete cascade,
  occurred_on date not null,
  occurred_at timestamptz not null default now(),
  response text not null check (response in ('followed','replaced')),
  cue text,
  desire text,
  old_response text,
  immediate_reward text,
  long_term_cost text,
  prime_response text,
  action_taken text,
  lesson text
);
create index pattern_occurrences_user_date_idx on public.pattern_occurrences (user_id, occurred_on desc);
create index pattern_occurrences_pattern_idx on public.pattern_occurrences (user_pattern_id);

create table public.courage_reps (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  occurred_at timestamptz not null default now(),
  type_id bigint references public.courage_rep_types(id) on delete set null,
  custom_label text,
  note text,
  source text not null default 'manual' check (source in ('manual','stuck'))
);
create index courage_reps_user_date_idx on public.courage_reps (user_id, occurred_on desc);
create index courage_reps_type_idx on public.courage_reps (type_id);

create table public.habit_stacks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  anchor text not null,
  behaviour text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);
create index habit_stacks_user_idx on public.habit_stacks (user_id);

create table public.stuck_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  avoiding text,
  why text check (why in ('fear','uncertainty','complexity','boredom','perfectionism','rejection','difficult_conversation','dont_know_where_to_begin','other')),
  smallest_action text,
  prime_self_would text,
  timer_seconds int not null default 900,
  completed_at timestamptz,
  outcome text check (outcome in ('yes','partly','no')),
  next_action text,
  courage_rep_id bigint references public.courage_reps(id) on delete set null
);
create index stuck_sessions_user_idx on public.stuck_sessions (user_id, started_at desc);
create index stuck_sessions_rep_idx on public.stuck_sessions (courage_rep_id);

create table public.ideas (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  captured_at timestamptz not null default now(),
  decision text check (decision in ('pursue','review_30','park','kill')),
  decided_at timestamptz,
  review_on date,
  filter_answers jsonb,
  project_id bigint references public.projects(id) on delete set null
);
create index ideas_user_idx on public.ideas (user_id, captured_at desc);
create index ideas_project_idx on public.ideas (project_id);

alter table public.projects
  add constraint projects_idea_fkey foreign key (idea_id) references public.ideas(id) on delete set null;
create index projects_idea_idx on public.projects (idea_id);

-- ---------------------------------------------------------------------------
-- Health
-- ---------------------------------------------------------------------------

create table public.health_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  starting_weight numeric(5,2),
  starting_body_fat numeric(4,1),
  target_weight numeric(5,2),
  target_body_fat_low numeric(4,1),
  target_body_fat_high numeric(4,1),
  resistance_per_week int,
  cardio_per_week int,
  cardio_calories_per_session int,
  steps_per_day int,
  hidden_fields text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger health_targets_updated_at before update on public.health_targets
  for each row execute function private.set_updated_at();

create table public.health_metrics (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null,
  weight numeric(5,2),
  body_fat numeric(4,1),
  waist numeric(5,1),
  sleep_hours numeric(3,1),
  sleep_quality int check (sleep_quality between 1 and 10),
  training_performance int check (training_performance between 1 and 10),
  steps int,
  calories int,
  protein int,
  cardio_calories int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, metric_date)
);
create index health_metrics_user_date_idx on public.health_metrics (user_id, metric_date desc);
create trigger health_metrics_updated_at before update on public.health_metrics
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reviews and cycles
-- ---------------------------------------------------------------------------

create table public.weekly_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  snapshot jsonb,
  answers jsonb not null default '{}'::jsonb,
  next_priority text,
  next_one_thing text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index weekly_reviews_user_idx on public.weekly_reviews (user_id, week_start desc);
create trigger weekly_reviews_updated_at before update on public.weekly_reviews
  for each row execute function private.set_updated_at();

create table public.cycles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check (status in ('active','closed')),
  closing_notes text,
  created_at timestamptz not null default now()
);
create index cycles_user_idx on public.cycles (user_id, starts_on desc);
create unique index cycles_one_active_idx on public.cycles (user_id) where status = 'active';

create table public.objectives (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_id bigint not null references public.cycles(id) on delete cascade,
  pillar text not null check (pillar in ('health','identity','relationships','purpose')),
  outcome text not null,
  why text,
  starting_point text,
  metric text,
  target text,
  leading_indicator text,
  next_action text,
  status text not null default 'on_track' check (status in ('on_track','at_risk','done','stopped')),
  end_decision text check (end_decision in ('continue','adapt','stop','scale')),
  sort_order int not null default 0
);
create index objectives_user_idx on public.objectives (user_id);
create index objectives_cycle_idx on public.objectives (cycle_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- User-owned tables: four policies each, ownership enforced on read and write.
do $$
declare
  t text;
  tables text[] := array[
    'profiles','north_stars','identity_statements','roadmap_items','vision_images',
    'projects','project_status_history','people_groups','people','interactions',
    'non_negotiables','daily_entries','daily_commitments','user_patterns',
    'pattern_occurrences','courage_reps','habit_stacks','stuck_sessions','ideas',
    'health_targets','health_metrics','weekly_reviews','cycles','objectives'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from public, anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || '_delete_own', t);
  end loop;
end $$;

-- Profiles: users may not grant themselves admin, a plan or a founding number.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    new.is_admin := old.is_admin;
    new.plan := old.plan;
    new.founding_number := old.founding_number;
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile_update();

-- Admin read access to profiles for the admin screen.
create policy profiles_select_admin on public.profiles
  for select to authenticated using ((select private.is_admin()));

-- Content tables: everyone signed in reads active rows; only admins write.
do $$
declare
  t text;
  tables text[] := array['pattern_library','courage_rep_types','non_negotiable_catalogue','review_questions'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from public, anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (is_active or (select private.is_admin()))',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',
      t || '_insert_admin', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      t || '_update_admin', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',
      t || '_delete_admin', t);
  end loop;
end $$;

alter table public.content_snippets enable row level security;
alter table public.content_snippets force row level security;
revoke all on public.content_snippets from public, anon;
grant select, insert, update, delete on public.content_snippets to authenticated;
create policy content_snippets_select on public.content_snippets for select to authenticated using (true);
create policy content_snippets_insert_admin on public.content_snippets for insert to authenticated with check ((select private.is_admin()));
create policy content_snippets_update_admin on public.content_snippets for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy content_snippets_delete_admin on public.content_snippets for delete to authenticated using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Views (security invoker so RLS applies)
-- ---------------------------------------------------------------------------

create view public.v_daily_scores with (security_invoker = true) as
  select user_id, entry_date, score, score_health, score_identity, score_relationships, score_purpose
  from public.daily_entries
  where evening_done_at is not null;
grant select on public.v_daily_scores to authenticated;

create view public.v_commitment_days with (security_invoker = true) as
  select c.user_id, c.entry_date, c.non_negotiable_id, c.completed
  from public.daily_commitments c;
grant select on public.v_commitment_days to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: vision images, one folder per user
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vision', 'vision', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy vision_select_own on storage.objects for select to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vision_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vision_update_own on storage.objects for update to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vision_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
