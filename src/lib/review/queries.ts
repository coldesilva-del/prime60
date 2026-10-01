import { addDays } from "@/lib/dates";
import type { createClient } from "@/lib/supabase/server";
import type { NonNegotiableRow, ReviewQuestionRow, WeeklyReviewRow } from "@/lib/supabase/types";
import { WEEK_DAYS, type SnapshotInputs, type SnapshotPattern } from "./snapshot";

type Db = Awaited<ReturnType<typeof createClient>>;

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Could not load ${what}: ${error?.message ?? "unknown error"}`);
}

/** Everything the snapshot needs for the week starting on `weekStart` (a Monday). */
export async function loadSnapshotInputs(db: Db, userId: string, weekStart: string): Promise<SnapshotInputs> {
  const weekEnd = addDays(weekStart, WEEK_DAYS - 1);
  const ninetyStart = addDays(weekEnd, -89);

  const [
    entries,
    commitments,
    nonNegotiables,
    userPatterns,
    library,
    occurrences,
    reps,
    repTypes,
    history,
    projects,
    interactions,
    people,
    metrics,
  ] = await Promise.all([
    db
      .from("daily_entries")
      .select(
        "entry_date, evening_done_at, trained, energy, published, moved_project, served, connected, quality_time, finished_one_thing",
      )
      .eq("user_id", userId)
      .gte("entry_date", weekStart)
      .lte("entry_date", weekEnd),
    db
      .from("daily_commitments")
      .select("entry_date, non_negotiable_id, completed")
      .eq("user_id", userId)
      .gte("entry_date", weekStart)
      .lte("entry_date", weekEnd),
    db.from("non_negotiables").select("id, label").eq("user_id", userId),
    db
      .from("user_patterns")
      .select("id, pattern_id, in_focus, replacement_override, if_then_override")
      .eq("user_id", userId),
    db.from("pattern_library").select("id, name, replacement, if_then"),
    db
      .from("pattern_occurrences")
      .select("occurred_on, user_pattern_id, response")
      .eq("user_id", userId)
      .gte("occurred_on", weekStart)
      .lte("occurred_on", weekEnd),
    db
      .from("courage_reps")
      .select("occurred_on, type_id, custom_label")
      .eq("user_id", userId)
      .gte("occurred_on", weekStart)
      .lte("occurred_on", weekEnd),
    db.from("courage_rep_types").select("id, label"),
    db
      .from("project_status_history")
      .select("project_id, to_status, changed_at")
      .eq("user_id", userId)
      .gte("changed_at", `${ninetyStart}T00:00:00.000Z`)
      .lte("changed_at", `${weekEnd}T23:59:59.999Z`),
    db.from("projects").select("id, name").eq("user_id", userId),
    db
      .from("interactions")
      .select("occurred_on, person_id, kind")
      .eq("user_id", userId)
      .gte("occurred_on", weekStart)
      .lte("occurred_on", weekEnd),
    db.from("people").select("id, name").eq("user_id", userId),
    db
      .from("health_metrics")
      .select("metric_date, weight, body_fat")
      .eq("user_id", userId)
      .gte("metric_date", weekStart)
      .lte("metric_date", weekEnd),
  ]);

  if (entries.error) fail("check-ins", entries.error);
  if (commitments.error) fail("commitments", commitments.error);
  if (nonNegotiables.error) fail("non-negotiables", nonNegotiables.error);
  if (userPatterns.error) fail("patterns", userPatterns.error);
  if (library.error) fail("pattern library", library.error);
  if (occurrences.error) fail("pattern appearances", occurrences.error);
  if (reps.error) fail("Courage Reps", reps.error);
  if (repTypes.error) fail("Courage Rep types", repTypes.error);
  if (history.error) fail("project history", history.error);
  if (projects.error) fail("projects", projects.error);
  if (interactions.error) fail("interactions", interactions.error);
  if (people.error) fail("people", people.error);
  if (metrics.error) fail("health metrics", metrics.error);

  const libById = new Map(library.data.map((l) => [l.id, l]));
  const patterns: SnapshotPattern[] = userPatterns.data.flatMap((up) => {
    const lib = libById.get(up.pattern_id);
    if (!lib) return [];
    return [
      {
        userPatternId: up.id,
        name: lib.name,
        inFocus: up.in_focus,
        replacement: up.replacement_override ?? lib.replacement,
        ifThen: up.if_then_override ?? lib.if_then,
      },
    ];
  });

  const repTypeById = new Map(repTypes.data.map((t) => [t.id, t.label]));
  const projectById = new Map(projects.data.map((p) => [p.id, p.name]));

  return {
    weekStart,
    entries: entries.data,
    commitments: commitments.data,
    nonNegotiables: nonNegotiables.data,
    patterns,
    occurrences: occurrences.data.map((o) => ({
      occurred_on: o.occurred_on,
      user_pattern_id: o.user_pattern_id,
      response: o.response,
    })),
    courageReps: reps.data.map((r) => ({
      occurred_on: r.occurred_on,
      label: r.custom_label ?? (r.type_id != null ? (repTypeById.get(r.type_id) ?? null) : null),
    })),
    statusChanges: history.data.map((h) => ({
      projectId: h.project_id,
      projectName: projectById.get(h.project_id) ?? "Project",
      toStatus: h.to_status,
      changedAt: h.changed_at,
    })),
    interactions: interactions.data,
    people: people.data,
    metrics: metrics.data.map((m) => ({
      metric_date: m.metric_date,
      weight: m.weight == null ? null : Number(m.weight),
      body_fat: m.body_fat == null ? null : Number(m.body_fat),
    })),
  };
}

export async function getReview(db: Db, userId: string, weekStart: string): Promise<WeeklyReviewRow | null> {
  const { data, error } = await db
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) fail("weekly review", error);
  return data;
}

export async function getReviewQuestions(db: Db): Promise<ReviewQuestionRow[]> {
  const { data, error } = await db
    .from("review_questions")
    .select("*")
    .eq("is_active", true)
    .order("section")
    .order("sort_order");
  if (error) fail("review questions", error);
  return data;
}

export interface PatternChoice {
  patternId: number;
  userPatternId: number | null;
  name: string;
  description: string;
  replacement: string;
  ifThen: string;
  inFocus: boolean;
}

/** Every active library pattern with the user's focus state, for rotating the five in focus. */
export async function getPatternChoices(db: Db, userId: string): Promise<PatternChoice[]> {
  const [library, mine] = await Promise.all([
    db
      .from("pattern_library")
      .select("id, name, description, replacement, if_then, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    db
      .from("user_patterns")
      .select("id, pattern_id, in_focus, replacement_override, if_then_override")
      .eq("user_id", userId),
  ]);
  if (library.error) fail("pattern library", library.error);
  if (mine.error) fail("patterns", mine.error);
  const byPattern = new Map(mine.data.map((m) => [m.pattern_id, m]));
  return library.data.map((l) => {
    const m = byPattern.get(l.id);
    return {
      patternId: l.id,
      userPatternId: m?.id ?? null,
      name: l.name,
      description: l.description,
      replacement: m?.replacement_override ?? l.replacement,
      ifThen: m?.if_then_override ?? l.if_then,
      inFocus: m?.in_focus ?? false,
    };
  });
}

export async function getActiveNonNegotiables(db: Db, userId: string): Promise<NonNegotiableRow[]> {
  const { data, error } = await db
    .from("non_negotiables")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) fail("non-negotiables", error);
  return data;
}

/** Past weeks with a review row, newest first, for the week picker. */
export async function getReviewWeeks(db: Db, userId: string, limit = 12) {
  const { data, error } = await db
    .from("weekly_reviews")
    .select("week_start, completed_at")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(limit);
  if (error) fail("review history", error);
  return data;
}
