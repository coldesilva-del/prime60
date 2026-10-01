"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { carryForward, cycleEndsOn, MAX_OBJECTIVES } from "./dates";
import { getActiveCycle, getCycle, getCycleObjectives, getObjective } from "./queries";
import { closeCycleSchema, END_DECISIONS, objectiveSchema, startCycleSchema, type EndDecision } from "./schemas";

const CYCLE_PATHS = ["/plan/cycle", "/plan/roadmap", "/today"];

function revalidateCycle() {
  for (const p of CYCLE_PATHS) revalidatePath(p);
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" ? v : undefined;
}

/** Starts a new cycle. With `fromCycleId`, carries Continue and Scale objectives across. */
export async function startCycleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = startCycleSchema.safeParse({
    startsOn: str(formData, "startsOn"),
    fromCycleId: str(formData, "fromCycleId") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { startsOn, fromCycleId } = parsed.data;

  const profile = await requireProfile();
  const db = await createClient();

  if (await getActiveCycle(db, profile.user_id)) {
    return { error: "A cycle is already running. Close it before starting another." };
  }

  const { data: cycle, error } = await db
    .from("cycles")
    .insert({ user_id: profile.user_id, starts_on: startsOn, ends_on: cycleEndsOn(startsOn), status: "active" })
    .select("id")
    .single();
  if (error || !cycle) return { error: "Could not start the cycle. Try again." };

  if (fromCycleId) {
    const previous = await getCycle(db, profile.user_id, fromCycleId);
    if (previous) {
      const carried = carryForward(await getCycleObjectives(db, profile.user_id, previous.id));
      if (carried.length) {
        const { error: copyError } = await db
          .from("objectives")
          .insert(carried.map((o) => ({ ...o, user_id: profile.user_id, cycle_id: cycle.id })));
        if (copyError) return { error: "The cycle started, but the objectives did not carry across. Add them again." };
      }
    }
  }

  revalidateCycle();
  redirect("/plan/cycle");
}

/** Creates (objectiveId null) or updates one objective in the active cycle. */
export async function saveObjectiveAction(
  objectiveId: number | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = objectiveSchema.safeParse({
    pillar: str(formData, "pillar"),
    outcome: str(formData, "outcome"),
    why: str(formData, "why"),
    startingPoint: str(formData, "startingPoint"),
    metric: str(formData, "metric"),
    target: str(formData, "target"),
    leadingIndicator: str(formData, "leadingIndicator"),
    nextAction: str(formData, "nextAction"),
    status: str(formData, "status") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const d = parsed.data;

  const profile = await requireProfile();
  const db = await createClient();

  const row = {
    pillar: d.pillar,
    outcome: d.outcome,
    why: d.why,
    starting_point: d.startingPoint,
    metric: d.metric,
    target: d.target,
    leading_indicator: d.leadingIndicator,
    next_action: d.nextAction,
    status: d.status,
  };

  if (objectiveId === null) {
    const cycle = await getActiveCycle(db, profile.user_id);
    if (!cycle) return { error: "Start a cycle before adding objectives." };
    const existing = await getCycleObjectives(db, profile.user_id, cycle.id);
    if (existing.length >= MAX_OBJECTIVES) {
      return { error: "Six objectives is the limit for a cycle. Finish or stop one first." };
    }
    const { error } = await db
      .from("objectives")
      .insert({ ...row, user_id: profile.user_id, cycle_id: cycle.id, sort_order: existing.length });
    if (error) return { error: "Could not save the objective. Try again." };
  } else {
    const current = await getObjective(db, profile.user_id, objectiveId);
    if (!current) return { error: "That objective no longer exists." };
    const { error } = await db.from("objectives").update(row).eq("id", objectiveId).eq("user_id", profile.user_id);
    if (error) return { error: "Could not save the objective. Try again." };
  }

  revalidateCycle();
  redirect("/plan/cycle");
}

export async function deleteObjectiveAction(objectiveId: number): Promise<void> {
  const profile = await requireProfile();
  const db = await createClient();
  await db.from("objectives").delete().eq("id", objectiveId).eq("user_id", profile.user_id);
  revalidateCycle();
  redirect("/plan/cycle");
}

/**
 * Closes the active cycle: an end decision per objective, closing notes,
 * status closed. Then offers the next cycle with Continue and Scale carried.
 */
export async function closeCycleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const decisions: { id: number; endDecision: EndDecision }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("decision_") || typeof value !== "string") continue;
    const id = Number(key.slice("decision_".length));
    if (Number.isInteger(id) && (END_DECISIONS as readonly string[]).includes(value)) {
      decisions.push({ id, endDecision: value as EndDecision });
    }
  }
  const parsed = closeCycleSchema.safeParse({ decisions, closingNotes: str(formData, "closingNotes") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const db = await createClient();
  const cycle = await getActiveCycle(db, profile.user_id);
  if (!cycle) return { error: "There is no cycle running." };

  const objectives = await getCycleObjectives(db, profile.user_id, cycle.id);
  const decided = new Map(parsed.data.decisions.map((d) => [d.id, d.endDecision]));
  const missing = objectives.filter((o) => !decided.has(o.id));
  if (missing.length) return { error: "Choose Continue, Adapt, Stop or Scale for every objective." };

  for (const o of objectives) {
    const { error } = await db
      .from("objectives")
      .update({ end_decision: decided.get(o.id) ?? null })
      .eq("id", o.id)
      .eq("user_id", profile.user_id);
    if (error) return { error: "Could not record the decisions. Try again." };
  }

  const { error } = await db
    .from("cycles")
    .update({ status: "closed", closing_notes: parsed.data.closingNotes || null })
    .eq("id", cycle.id)
    .eq("user_id", profile.user_id);
  if (error) return { error: "Could not close the cycle. Try again." };

  revalidateCycle();
  redirect(`/plan/cycle/new?from=${cycle.id}`);
}
