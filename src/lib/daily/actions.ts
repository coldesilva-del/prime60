"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { todayIn, type DayString } from "@/lib/dates";
import { computeScore, type ScoreResult } from "@/lib/scoring/score";
import type { ActionState } from "@/lib/auth/schemas";
import type { DailyEntryRow, Json, ProfileRow, ScoreKey, Updates } from "@/lib/supabase/types";
import {
  commitmentValuesFromEvening,
  entryColumnForScoreKey,
  toScoreInputs,
  type EveningValues,
} from "./helpers";
import { countCourageRepsToday, getOrCreateTodayEntry, getPatternCountsToday, type DbClient } from "./queries";
import {
  closingLineSchema,
  eveningSchema,
  finishedSchema,
  morningSchema,
  toggleCommitmentSchema,
  type EveningInput,
  type MorningInput,
} from "./schemas";

const GENERIC_ERROR = "That did not save. Try again.";

interface Ctx {
  db: DbClient;
  profile: ProfileRow;
  userId: string;
  day: DayString;
}

async function ctx(): Promise<Ctx> {
  const [profile, db] = await Promise.all([requireProfile(), createClient()]);
  return { db, profile, userId: profile.user_id, day: todayIn(profile.timezone) };
}

function revalidateToday() {
  revalidatePath("/today");
  revalidatePath("/today/evening");
  revalidatePath("/today/morning");
}

/** Insert a Courage Rep for today unless one already exists. */
async function ensureCourageRep(c: Ctx, typeId: number | null): Promise<void> {
  const count = await countCourageRepsToday(c.db, c.userId, c.day);
  if (count > 0) return;
  const { error } = await c.db.from("courage_reps").insert({
    user_id: c.userId,
    occurred_on: c.day,
    type_id: typeId,
    source: "manual",
  });
  if (error) throw new Error(`Could not record the Courage Rep: ${error.message}`);
}

/** Insert a 'contact' interaction for the person today unless one already exists. */
async function ensureContactInteraction(c: Ctx, personId: number): Promise<void> {
  const { data, error } = await c.db
    .from("interactions")
    .select("id")
    .eq("user_id", c.userId)
    .eq("person_id", personId)
    .eq("occurred_on", c.day)
    .eq("kind", "contact")
    .limit(1);
  if (error) throw new Error(`Could not load interactions: ${error.message}`);
  if (data && data.length > 0) return;
  const { error: insertError } = await c.db.from("interactions").insert({
    user_id: c.userId,
    person_id: personId,
    occurred_on: c.day,
    kind: "contact",
  });
  if (insertError) throw new Error(`Could not record the connection: ${insertError.message}`);
}

async function updateEntry(c: Ctx, entryId: number, patch: Updates<"daily_entries">): Promise<void> {
  const { error } = await c.db.from("daily_entries").update(patch).eq("id", entryId).eq("user_id", c.userId);
  if (error) throw new Error(`Could not update today's entry: ${error.message}`);
}

/** Set today's commitment for every active non-negotiable carrying the given score keys. */
async function setCommitmentsForKeys(c: Ctx, values: Partial<Record<ScoreKey, boolean>>): Promise<void> {
  const keys = Object.keys(values) as ScoreKey[];
  if (keys.length === 0) return;
  const { data, error } = await c.db
    .from("non_negotiables")
    .select("id, score_key")
    .eq("user_id", c.userId)
    .eq("is_active", true)
    .in("score_key", keys);
  if (error) throw new Error(`Could not load non-negotiables: ${error.message}`);
  if (!data || data.length === 0) return;
  const now = new Date().toISOString();
  const rows = data.map((n) => {
    const completed = values[n.score_key] === true;
    return {
      user_id: c.userId,
      entry_date: c.day,
      non_negotiable_id: n.id,
      completed,
      completed_at: completed ? now : null,
    };
  });
  const { error: upsertError } = await c.db
    .from("daily_commitments")
    .upsert(rows, { onConflict: "user_id,entry_date,non_negotiable_id" });
  if (upsertError) throw new Error(`Could not update commitments: ${upsertError.message}`);
}

/**
 * Mirror a tapped non-negotiable onto the daily_entries column the evening reads,
 * creating the Courage Rep or interaction evidence where the item is evidenced by a row.
 * Un-toggling clears the boolean only; evidence rows are never deleted.
 */
async function mirrorScoreKey(c: Ctx, entry: DailyEntryRow, key: ScoreKey, completed: boolean): Promise<void> {
  const column = entryColumnForScoreKey(key, c.profile.health_mode);
  if (column) {
    const patch: Updates<"daily_entries"> = {};
    patch[column] = completed;
    await updateEntry(c, entry.id, patch);
  }
  if (!completed) return;
  if (key === "i2") await ensureCourageRep(c, entry.courage_intent_type_id);
  if (key === "r1" && entry.person_id) await ensureContactInteraction(c, entry.person_id);
}

async function ownsRow(c: Ctx, table: "projects" | "people", id: number | null): Promise<boolean> {
  if (id == null) return true;
  const { data } = await c.db.from(table).select("id").eq("user_id", c.userId).eq("id", id).maybeSingle();
  return data != null;
}

export async function saveMorning(input: MorningInput): Promise<ActionState> {
  const parsed = morningSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  const c = await ctx();
  const { oneThing, oneThingProjectId, courageIntentTypeId, personId } = parsed.data;
  const [projectOk, personOk] = await Promise.all([ownsRow(c, "projects", oneThingProjectId), ownsRow(c, "people", personId)]);
  if (!projectOk || !personOk) return { error: GENERIC_ERROR };

  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);
  await updateEntry(c, entry.id, {
    one_thing: oneThing,
    one_thing_project_id: oneThingProjectId,
    courage_intent_type_id: courageIntentTypeId,
    person_id: personId,
    morning_done_at: entry.morning_done_at ?? new Date().toISOString(),
  });
  revalidateToday();
  redirect("/today");
}

export async function toggleCommitment(nonNegotiableId: number, completed: boolean): Promise<ActionState> {
  const parsed = toggleCommitmentSchema.safeParse({ nonNegotiableId, completed });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const c = await ctx();

  const { data: nn, error } = await c.db
    .from("non_negotiables")
    .select("id, score_key")
    .eq("user_id", c.userId)
    .eq("id", parsed.data.nonNegotiableId)
    .maybeSingle();
  if (error || !nn) return { error: "That non-negotiable is no longer available." };

  const { error: upsertError } = await c.db.from("daily_commitments").upsert(
    {
      user_id: c.userId,
      entry_date: c.day,
      non_negotiable_id: nn.id,
      completed: parsed.data.completed,
      completed_at: parsed.data.completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,entry_date,non_negotiable_id" },
  );
  if (upsertError) return { error: GENERIC_ERROR };

  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);
  await mirrorScoreKey(c, entry, nn.score_key, parsed.data.completed);
  revalidateToday();
  return { ok: true };
}

export async function setOneThingFinished(finished: boolean): Promise<ActionState> {
  const parsed = finishedSchema.safeParse({ finished });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const c = await ctx();
  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);
  await updateEntry(c, entry.id, { finished_one_thing: parsed.data.finished });
  await setCommitmentsForKeys(c, { i1: parsed.data.finished });
  revalidateToday();
  return { ok: true };
}

/** Records today's intended Courage Rep as done (one rep per day from this path). */
export async function recordCourageIntent(): Promise<ActionState> {
  const c = await ctx();
  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);
  await ensureCourageRep(c, entry.courage_intent_type_id);
  await setCommitmentsForKeys(c, { i2: true });
  revalidateToday();
  return { ok: true };
}

/** Records contact with today's person and marks the day connected. */
export async function recordConnectedToday(): Promise<ActionState> {
  const c = await ctx();
  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);
  if (entry.person_id) await ensureContactInteraction(c, entry.person_id);
  await updateEntry(c, entry.id, { connected: true });
  await setCommitmentsForKeys(c, { r1: true });
  revalidateToday();
  return { ok: true };
}

export type EveningActionState = ActionState & { result?: ScoreResult };

/** Saves the evening check-in, computes and persists the Prime Score, and returns it for the reveal. */
export async function saveEvening(input: EveningInput): Promise<EveningActionState> {
  const parsed = eveningSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  const c = await ctx();
  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);

  // A Yes for the Courage Rep with no rep yet creates one with no type. Existing reps are evidence.
  if (parsed.data.courageRepToday) await ensureCourageRep(c, entry.courage_intent_type_id);
  const [reps, patterns] = await Promise.all([
    countCourageRepsToday(c.db, c.userId, c.day),
    getPatternCountsToday(c.db, c.userId, c.day),
  ]);

  const values: EveningValues = { ...parsed.data, courageRepToday: reps > 0 };
  const result = computeScore(toScoreInputs(values, c.profile.health_mode, patterns));

  await updateEntry(c, entry.id, {
    trained: values.trained,
    moved: values.moved,
    logged_with_coach: values.loggedWithCoach,
    energy: values.energy,
    finished_one_thing: values.finishedOneThing,
    connected: values.connected,
    quality_time: values.qualityTime,
    published: values.published,
    moved_project: values.movedProject,
    served: values.served,
    score: result.score,
    score_health: result.pillars.health,
    score_identity: result.pillars.identity,
    score_relationships: result.pillars.relationships,
    score_purpose: result.pillars.purpose,
    score_breakdown: result.breakdown as unknown as Json,
    evening_done_at: new Date().toISOString(),
  });

  // Evidence over intention: commitments follow what the evening confirmed.
  await setCommitmentsForKeys(c, commitmentValuesFromEvening(values, c.profile.health_mode));

  revalidateToday();
  return { ok: true, result };
}

export async function saveClosingLine(closingLine: string): Promise<ActionState> {
  const parsed = closingLineSchema.safeParse({ closingLine });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  const c = await ctx();
  const entry = await getOrCreateTodayEntry(c.userId, c.day, c.db);
  await updateEntry(c, entry.id, { closing_line: parsed.data.closingLine || null });
  revalidateToday();
  return { ok: true };
}
