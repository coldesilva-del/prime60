/**
 * Database types, hand-written from supabase/migrations to match the shape
 * `supabase gen types typescript` produces. Replace with generated output once
 * the project is provisioned (npm run db:types) and diff against this file.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Tbl<Row, Req extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Req> & Partial<Omit<Row, Req>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Pillar = "health" | "identity" | "relationships" | "purpose";
export type ScoreKey = "h1" | "h2" | "i1" | "i2" | "r1" | "r2" | "p1" | "p2" | "p3";
export type ProjectStatus = "idea" | "active" | "blocked" | "paused" | "finished" | "killed";
export type GroupKey = "partner" | "children" | "family" | "friends" | "community";
export type InteractionKind = "contact" | "quality_time" | "support" | "conversation" | "gratitude" | "note";
export type NorthStarSection = "health" | "purpose" | "relationships" | "identity" | "lifestyle" | "moment";
export type StuckWhy =
  | "fear"
  | "uncertainty"
  | "complexity"
  | "boredom"
  | "perfectionism"
  | "rejection"
  | "difficult_conversation"
  | "dont_know_where_to_begin"
  | "other";

export type ProfileRow = {
  user_id: string;
  first_name: string | null;
  timezone: string;
  target_year: number | null;
  birth_year: number | null;
  plan: "founding" | "early_access" | "paid";
  founding_number: number | null;
  is_admin: boolean;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  mailchimp_synced_at: string | null;
  health_mode: "track" | "coached";
  evening_hour: number;
  weigh_in_dow: number;
  active_project_limit: number;
  theme: "system" | "light" | "dark";
  onboarding_step: number;
  onboarding_completed_at: string | null;
  skool_link_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PatternLibraryRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  replacement: string;
  if_then: string;
  two_minute_start: string | null;
  sort_order: number;
  is_active: boolean;
}

export type CourageRepTypeRow = {
  id: number;
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export type NonNegotiableCatalogueRow = {
  id: number;
  slug: string;
  label: string;
  pillar: Pillar;
  score_key: ScoreKey;
  sort_order: number;
  is_active: boolean;
}

export type ReviewQuestionRow = {
  id: number;
  section: "a" | "b" | "c" | "d" | "e" | "f";
  slug: string;
  prompt: string;
  sort_order: number;
  is_active: boolean;
}

export type ContentSnippetRow = {
  id: number;
  key: string;
  body: string;
  updated_at: string;
}

export type NorthStarRow = {
  id: number;
  user_id: string;
  section: NorthStarSection;
  body: string;
  updated_at: string;
}

export type IdentityStatementRow = {
  id: number;
  user_id: string;
  body: string;
  is_primary: boolean;
  created_at: string;
}

export type RoadmapItemRow = {
  id: number;
  user_id: string;
  horizon: "90d" | "1y" | "3y" | "5y";
  body: string;
  sort_order: number;
}

export type VisionImageRow = {
  id: number;
  user_id: string;
  section: string;
  storage_path: string;
  created_at: string;
}

export type ProjectRow = {
  id: number;
  user_id: string;
  name: string;
  pillar: Pillar;
  definition_of_done: string | null;
  started_on: string | null;
  target_on: string | null;
  finished_on: string | null;
  next_action: string | null;
  status: ProjectStatus;
  notes: string | null;
  idea_id: number | null;
  limit_overridden: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectStatusHistoryRow = {
  id: number;
  user_id: string;
  project_id: number;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  note: string | null;
}

export type PeopleGroupRow = {
  id: number;
  user_id: string;
  key: GroupKey;
  label: string;
  default_cadence_days: number;
  sort_order: number;
}

export type PersonRow = {
  id: number;
  user_id: string;
  group_id: number;
  name: string;
  cadence_days: number;
  is_active: boolean;
  created_at: string;
}

export type InteractionRow = {
  id: number;
  user_id: string;
  person_id: number;
  occurred_on: string;
  kind: InteractionKind;
  connection_rating: number | null;
  note: string | null;
  created_at: string;
}

export type NonNegotiableRow = {
  id: number;
  user_id: string;
  label: string;
  pillar: Pillar;
  score_key: ScoreKey;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type DailyEntryRow = {
  id: number;
  user_id: string;
  entry_date: string;
  morning_done_at: string | null;
  one_thing: string | null;
  one_thing_project_id: number | null;
  courage_intent_type_id: number | null;
  person_id: number | null;
  trained: boolean | null;
  moved: boolean | null;
  logged_with_coach: boolean | null;
  energy: number | null;
  finished_one_thing: boolean | null;
  connected: boolean | null;
  quality_time: boolean | null;
  published: boolean | null;
  moved_project: boolean | null;
  served: boolean | null;
  closing_line: string | null;
  evening_done_at: string | null;
  score: number | null;
  score_health: number | null;
  score_identity: number | null;
  score_relationships: number | null;
  score_purpose: number | null;
  score_breakdown: Json | null;
  created_at: string;
  updated_at: string;
}

export type DailyCommitmentRow = {
  id: number;
  user_id: string;
  entry_date: string;
  non_negotiable_id: number;
  completed: boolean;
  completed_at: string | null;
}

export type UserPatternRow = {
  id: number;
  user_id: string;
  pattern_id: number;
  in_focus: boolean;
  replacement_override: string | null;
  if_then_override: string | null;
  created_at: string;
}

export type PatternOccurrenceRow = {
  id: number;
  user_id: string;
  user_pattern_id: number;
  occurred_on: string;
  occurred_at: string;
  response: "followed" | "replaced";
  cue: string | null;
  desire: string | null;
  old_response: string | null;
  immediate_reward: string | null;
  long_term_cost: string | null;
  prime_response: string | null;
  action_taken: string | null;
  lesson: string | null;
}

export type CourageRepRow = {
  id: number;
  user_id: string;
  occurred_on: string;
  occurred_at: string;
  type_id: number | null;
  custom_label: string | null;
  note: string | null;
  source: "manual" | "stuck";
}

export type HabitStackRow = {
  id: number;
  user_id: string;
  anchor: string;
  behaviour: string;
  sort_order: number;
  is_active: boolean;
}

export type StuckSessionRow = {
  id: number;
  user_id: string;
  started_at: string;
  avoiding: string | null;
  why: StuckWhy | null;
  smallest_action: string | null;
  prime_self_would: string | null;
  timer_seconds: number;
  completed_at: string | null;
  outcome: "yes" | "partly" | "no" | null;
  next_action: string | null;
  courage_rep_id: number | null;
}

export type IdeaRow = {
  id: number;
  user_id: string;
  title: string;
  note: string | null;
  captured_at: string;
  decision: "pursue" | "review_30" | "park" | "kill" | null;
  decided_at: string | null;
  review_on: string | null;
  filter_answers: Json | null;
  project_id: number | null;
}

export type HealthTargetsRow = {
  user_id: string;
  starting_weight: number | null;
  starting_body_fat: number | null;
  target_weight: number | null;
  target_body_fat_low: number | null;
  target_body_fat_high: number | null;
  resistance_per_week: number | null;
  cardio_per_week: number | null;
  cardio_calories_per_session: number | null;
  steps_per_day: number | null;
  hidden_fields: string[];
  updated_at: string;
}

export type HealthMetricRow = {
  id: number;
  user_id: string;
  metric_date: string;
  weight: number | null;
  body_fat: number | null;
  waist: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  training_performance: number | null;
  steps: number | null;
  calories: number | null;
  protein: number | null;
  cardio_calories: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type WeeklyReviewRow = {
  id: number;
  user_id: string;
  week_start: string;
  snapshot: Json | null;
  answers: Json;
  next_priority: string | null;
  next_one_thing: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CycleRow = {
  id: number;
  user_id: string;
  starts_on: string;
  ends_on: string;
  status: "active" | "closed";
  closing_notes: string | null;
  created_at: string;
}

export type ObjectiveRow = {
  id: number;
  user_id: string;
  cycle_id: number;
  pillar: Pillar;
  outcome: string;
  why: string | null;
  starting_point: string | null;
  metric: string | null;
  target: string | null;
  leading_indicator: string | null;
  next_action: string | null;
  status: "on_track" | "at_risk" | "done" | "stopped";
  end_decision: "continue" | "adapt" | "stop" | "scale" | null;
  sort_order: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: Tbl<ProfileRow, "user_id">;
      pattern_library: Tbl<PatternLibraryRow, "slug" | "name" | "description" | "replacement" | "if_then">;
      courage_rep_types: Tbl<CourageRepTypeRow, "slug" | "label">;
      non_negotiable_catalogue: Tbl<NonNegotiableCatalogueRow, "slug" | "label" | "pillar" | "score_key">;
      review_questions: Tbl<ReviewQuestionRow, "section" | "slug" | "prompt">;
      content_snippets: Tbl<ContentSnippetRow, "key" | "body">;
      north_stars: Tbl<NorthStarRow, "user_id" | "section">;
      identity_statements: Tbl<IdentityStatementRow, "user_id" | "body">;
      roadmap_items: Tbl<RoadmapItemRow, "user_id" | "horizon" | "body">;
      vision_images: Tbl<VisionImageRow, "user_id" | "section" | "storage_path">;
      projects: Tbl<ProjectRow, "user_id" | "name" | "pillar">;
      project_status_history: Tbl<ProjectStatusHistoryRow, "user_id" | "project_id" | "to_status">;
      people_groups: Tbl<PeopleGroupRow, "user_id" | "key" | "label">;
      people: Tbl<PersonRow, "user_id" | "group_id" | "name">;
      interactions: Tbl<InteractionRow, "user_id" | "person_id" | "occurred_on" | "kind">;
      non_negotiables: Tbl<NonNegotiableRow, "user_id" | "label" | "pillar" | "score_key">;
      daily_entries: Tbl<DailyEntryRow, "user_id" | "entry_date">;
      daily_commitments: Tbl<DailyCommitmentRow, "user_id" | "entry_date" | "non_negotiable_id">;
      user_patterns: Tbl<UserPatternRow, "user_id" | "pattern_id">;
      pattern_occurrences: Tbl<PatternOccurrenceRow, "user_id" | "user_pattern_id" | "occurred_on" | "response">;
      courage_reps: Tbl<CourageRepRow, "user_id" | "occurred_on">;
      habit_stacks: Tbl<HabitStackRow, "user_id" | "anchor" | "behaviour">;
      stuck_sessions: Tbl<StuckSessionRow, "user_id">;
      ideas: Tbl<IdeaRow, "user_id" | "title">;
      health_targets: Tbl<HealthTargetsRow, "user_id">;
      health_metrics: Tbl<HealthMetricRow, "user_id" | "metric_date">;
      weekly_reviews: Tbl<WeeklyReviewRow, "user_id" | "week_start">;
      cycles: Tbl<CycleRow, "user_id" | "starts_on" | "ends_on">;
      objectives: Tbl<ObjectiveRow, "user_id" | "cycle_id" | "pillar" | "outcome">;
    };
    Views: {
      v_daily_scores: {
        Row: Pick<DailyEntryRow, "user_id" | "entry_date" | "score" | "score_health" | "score_identity" | "score_relationships" | "score_purpose">;
        Relationships: [];
      };
      v_commitment_days: {
        Row: Pick<DailyCommitmentRow, "user_id" | "entry_date" | "non_negotiable_id" | "completed">;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
