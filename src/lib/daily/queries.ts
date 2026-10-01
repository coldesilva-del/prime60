import { createClient } from "@/lib/supabase/server";
import { addDays, weekStart, type DayString } from "@/lib/dates";
import { computeTrajectory, type DailyScoreRow, type Trajectory } from "@/lib/scoring/trajectory";
import type {
  CourageRepTypeRow,
  DailyEntryRow,
  HabitStackRow,
  IdentityStatementRow,
  NonNegotiableRow,
  Pillar,
  ProfileRow,
  ScoreKey,
} from "@/lib/supabase/types";

export type DbClient = Awaited<ReturnType<typeof createClient>>;

function must<T>(data: T | null, error: { message: string } | null, what: string): T {
  if (error) throw new Error(`Could not load ${what}: ${error.message}`);
  if (data == null) throw new Error(`Could not load ${what}`);
  return data;
}

/** Today's row in daily_entries, created on first read. */
export async function getOrCreateTodayEntry(userId: string, day: DayString, client?: DbClient): Promise<DailyEntryRow> {
  const db = client ?? (await createClient());
  const { data: existing, error } = await db
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", day)
    .maybeSingle();
  if (error) throw new Error(`Could not load today's entry: ${error.message}`);
  if (existing) return existing;

  // Upsert so two concurrent first reads of the day cannot both insert.
  const { data, error: upsertError } = await db
    .from("daily_entries")
    .upsert({ user_id: userId, entry_date: day }, { onConflict: "user_id,entry_date" })
    .select("*")
    .single();
  return must(data, upsertError, "today's entry");
}

export interface Commitment {
  id: number;
  label: string;
  pillar: Pillar;
  scoreKey: ScoreKey;
  sortOrder: number;
  completed: boolean;
}

export async function getActiveNonNegotiables(db: DbClient, userId: string): Promise<NonNegotiableRow[]> {
  const { data, error } = await db
    .from("non_negotiables")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");
  return must(data, error, "non-negotiables");
}

/**
 * Today's completion state for each active non-negotiable.
 * Missing daily_commitments rows are created lazily on the first read of the day
 * so Return Rate sees every day, including the ones with no taps.
 */
export async function getTodayCommitments(
  db: DbClient,
  userId: string,
  day: DayString,
  nonNegotiables: NonNegotiableRow[],
): Promise<Commitment[]> {
  if (nonNegotiables.length === 0) return [];
  const load = async () => {
    const { data, error } = await db
      .from("daily_commitments")
      .select("non_negotiable_id, completed")
      .eq("user_id", userId)
      .eq("entry_date", day);
    return must(data, error, "today's commitments");
  };

  let rows = await load();
  const have = new Set(rows.map((r) => r.non_negotiable_id));
  const missing = nonNegotiables
    .filter((n) => !have.has(n.id))
    .map((n) => ({ user_id: userId, entry_date: day, non_negotiable_id: n.id }));
  if (missing.length > 0) {
    const { error } = await db
      .from("daily_commitments")
      .upsert(missing, { onConflict: "user_id,entry_date,non_negotiable_id", ignoreDuplicates: true });
    if (error) throw new Error(`Could not create today's commitments: ${error.message}`);
    rows = await load();
  }

  const byId = new Map(rows.map((r) => [r.non_negotiable_id, r.completed]));
  return nonNegotiables.map((n) => ({
    id: n.id,
    label: n.label,
    pillar: n.pillar,
    scoreKey: n.score_key,
    sortOrder: n.sort_order,
    completed: byId.get(n.id) ?? false,
  }));
}

export async function getTrajectory(db: DbClient, userId: string, day: DayString): Promise<Trajectory> {
  const { data, error } = await db
    .from("v_daily_scores")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", addDays(day, -55))
    .lte("entry_date", day);
  const rows: DailyScoreRow[] = must(data, error, "scores").map((r) => ({
    entryDate: r.entry_date,
    score: r.score ?? 0,
    health: r.score_health ?? 0,
    identity: r.score_identity ?? 0,
    relationships: r.score_relationships ?? 0,
    purpose: r.score_purpose ?? 0,
  }));
  return computeTrajectory(rows, day);
}

export async function countCourageRepsToday(db: DbClient, userId: string, day: DayString): Promise<number> {
  const { count, error } = await db
    .from("courage_reps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("occurred_on", day);
  if (error) throw new Error(`Could not load Courage Reps: ${error.message}`);
  return count ?? 0;
}

export interface PatternCounts {
  followed: number;
  replaced: number;
}

export async function getPatternCountsToday(db: DbClient, userId: string, day: DayString): Promise<PatternCounts> {
  const { data, error } = await db
    .from("pattern_occurrences")
    .select("response")
    .eq("user_id", userId)
    .eq("occurred_on", day);
  const rows = must(data, error, "pattern occurrences");
  return {
    followed: rows.filter((r) => r.response === "followed").length,
    replaced: rows.filter((r) => r.response === "replaced").length,
  };
}

export interface PersonOption {
  id: number;
  name: string;
  groupLabel: string;
  isActive: boolean;
}

/** Every person with their group label, groups in their sort order. */
export async function getPeople(db: DbClient, userId: string): Promise<PersonOption[]> {
  const [people, groups] = await Promise.all([
    db.from("people").select("id, name, group_id, is_active").eq("user_id", userId).order("name"),
    db.from("people_groups").select("id, label, sort_order").eq("user_id", userId),
  ]);
  const groupRows = must(groups.data, groups.error, "people groups");
  const order = new Map(groupRows.map((g) => [g.id, g.sort_order]));
  const label = new Map(groupRows.map((g) => [g.id, g.label]));
  const rows = must(people.data, people.error, "people");
  const groupOrder = new Map(rows.map((p) => [p.id, order.get(p.group_id) ?? 0]));
  return rows
    .map((p) => ({ id: p.id, name: p.name, groupLabel: label.get(p.group_id) ?? "", isActive: p.is_active }))
    .sort((a, b) => (groupOrder.get(a.id) ?? 0) - (groupOrder.get(b.id) ?? 0) || a.name.localeCompare(b.name));
}

export interface ProjectOption {
  id: number;
  name: string;
  nextAction: string | null;
}

export async function getActiveProjects(db: DbClient, userId: string): Promise<ProjectOption[]> {
  const { data, error } = await db
    .from("projects")
    .select("id, name, next_action")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at");
  return must(data, error, "projects").map((p) => ({ id: p.id, name: p.name, nextAction: p.next_action }));
}

export async function getActiveHabitStacks(db: DbClient, userId: string): Promise<HabitStackRow[]> {
  const { data, error } = await db
    .from("habit_stacks")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");
  return must(data, error, "habit stacks");
}

export async function isWeekReviewCompleted(db: DbClient, userId: string, day: DayString): Promise<boolean> {
  const { data, error } = await db
    .from("weekly_reviews")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("week_start", weekStart(day))
    .maybeSingle();
  if (error) throw new Error(`Could not load the weekly review: ${error.message}`);
  return data?.completed_at != null;
}

export async function hasWeightToday(db: DbClient, userId: string, day: DayString): Promise<boolean> {
  const { data, error } = await db
    .from("health_metrics")
    .select("weight")
    .eq("user_id", userId)
    .eq("metric_date", day)
    .maybeSingle();
  if (error) throw new Error(`Could not load health metrics: ${error.message}`);
  return data?.weight != null;
}

export async function getCourageRepTypes(db: DbClient): Promise<CourageRepTypeRow[]> {
  const { data, error } = await db.from("courage_rep_types").select("*").eq("is_active", true).order("sort_order");
  return must(data, error, "Courage Rep types");
}

export async function getPrimaryIdentityStatement(db: DbClient, userId: string): Promise<IdentityStatementRow | null> {
  const { data, error } = await db
    .from("identity_statements")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load identity statement: ${error.message}`);
  return data;
}

export async function getYesterdayEntry(
  db: DbClient,
  userId: string,
  day: DayString,
): Promise<Pick<DailyEntryRow, "one_thing" | "one_thing_project_id" | "finished_one_thing"> | null> {
  const { data, error } = await db
    .from("daily_entries")
    .select("one_thing, one_thing_project_id, finished_one_thing")
    .eq("user_id", userId)
    .eq("entry_date", addDays(day, -1))
    .maybeSingle();
  if (error) throw new Error(`Could not load yesterday: ${error.message}`);
  return data;
}

export interface TodayData {
  entry: DailyEntryRow;
  commitments: Commitment[];
  trajectory: Trajectory;
  courageRepsToday: number;
  patterns: PatternCounts;
  people: PersonOption[];
  projects: ProjectOption[];
  habitStacks: HabitStackRow[];
  courageRepTypes: CourageRepTypeRow[];
  reviewCompleted: boolean;
  weightLoggedToday: boolean;
}

/** Everything the Today screen needs, loaded in parallel. */
export async function loadToday(profile: ProfileRow, day: DayString): Promise<TodayData> {
  const db = await createClient();
  const userId = profile.user_id;
  const [entry, nonNegotiables, trajectory, courageRepsToday, patterns, people, projects, habitStacks, courageRepTypes, reviewCompleted, weightLoggedToday] =
    await Promise.all([
      getOrCreateTodayEntry(userId, day, db),
      getActiveNonNegotiables(db, userId),
      getTrajectory(db, userId, day),
      countCourageRepsToday(db, userId, day),
      getPatternCountsToday(db, userId, day),
      getPeople(db, userId),
      getActiveProjects(db, userId),
      getActiveHabitStacks(db, userId),
      getCourageRepTypes(db),
      isWeekReviewCompleted(db, userId, day),
      hasWeightToday(db, userId, day),
    ]);
  const commitments = await getTodayCommitments(db, userId, day, nonNegotiables);
  return {
    entry,
    commitments,
    trajectory,
    courageRepsToday,
    patterns,
    people,
    projects,
    habitStacks,
    courageRepTypes,
    reviewCompleted,
    weightLoggedToday,
  };
}

export interface MorningData {
  entry: DailyEntryRow;
  identity: IdentityStatementRow | null;
  nonNegotiables: NonNegotiableRow[];
  yesterday: Awaited<ReturnType<typeof getYesterdayEntry>>;
  projects: ProjectOption[];
  courageRepTypes: CourageRepTypeRow[];
  people: PersonOption[];
}

export async function loadMorning(profile: ProfileRow, day: DayString): Promise<MorningData> {
  const db = await createClient();
  const userId = profile.user_id;
  const [entry, identity, nonNegotiables, yesterday, projects, courageRepTypes, people] = await Promise.all([
    getOrCreateTodayEntry(userId, day, db),
    getPrimaryIdentityStatement(db, userId),
    getActiveNonNegotiables(db, userId),
    getYesterdayEntry(db, userId, day),
    getActiveProjects(db, userId),
    getCourageRepTypes(db),
    getPeople(db, userId),
  ]);
  return { entry, identity, nonNegotiables, yesterday, projects, courageRepTypes, people: people.filter((p) => p.isActive) };
}

export interface EveningData {
  entry: DailyEntryRow;
  commitments: Commitment[];
  courageRepsToday: number;
  patterns: PatternCounts;
  personName: string | null;
  projectName: string | null;
}

export async function loadEvening(profile: ProfileRow, day: DayString): Promise<EveningData> {
  const db = await createClient();
  const userId = profile.user_id;
  const [entry, nonNegotiables, courageRepsToday, patterns, people, projects] = await Promise.all([
    getOrCreateTodayEntry(userId, day, db),
    getActiveNonNegotiables(db, userId),
    countCourageRepsToday(db, userId, day),
    getPatternCountsToday(db, userId, day),
    getPeople(db, userId),
    getActiveProjects(db, userId),
  ]);
  const commitments = await getTodayCommitments(db, userId, day, nonNegotiables);
  const person = entry.person_id ? people.find((p) => p.id === entry.person_id) : undefined;
  const project =
    (entry.one_thing_project_id ? projects.find((p) => p.id === entry.one_thing_project_id) : undefined) ?? projects[0];
  return {
    entry,
    commitments,
    courageRepsToday,
    patterns,
    personName: person?.name ?? null,
    projectName: project?.name ?? null,
  };
}
