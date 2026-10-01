"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { todayIn, weekStart as mondayOf } from "@/lib/dates";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import { computeSnapshot, isReviewSnapshot, type ReviewSnapshot } from "./snapshot";
import { getReview, loadSnapshotInputs } from "./queries";
import {
  answersFrom,
  MAX_PATTERNS_IN_FOCUS,
  recomputeSnapshotSchema,
  saveSectionSchema,
  setPatternFocusSchema,
} from "./schemas";

const REVIEW_PATHS = ["/today/review", "/today"];

function revalidateReview() {
  for (const p of REVIEW_PATHS) revalidatePath(p);
}

/** A review week must be a Monday no later than the current week. */
function validWeek(weekStart: string, timezone: string): string | null {
  if (mondayOf(weekStart) !== weekStart) return "That is not the start of a week.";
  if (weekStart > mondayOf(todayIn(timezone))) return "That week has not started yet.";
  return null;
}

/**
 * Saves one section's answers, merging into the stored answers so partial
 * completion is normal. Freezes the snapshot on the first save.
 */
export async function saveReviewSectionAction(input: unknown): Promise<ActionState> {
  const parsed = saveSectionSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { weekStart, answers, nextPriority, nextOneThing, complete } = parsed.data;

  const profile = await requireProfile();
  const weekError = validWeek(weekStart, profile.timezone);
  if (weekError) return { error: weekError };

  const db = await createClient();
  const existing = await getReview(db, profile.user_id, weekStart);

  let snapshot: ReviewSnapshot;
  if (existing && isReviewSnapshot(existing.snapshot)) {
    snapshot = existing.snapshot;
  } else {
    snapshot = computeSnapshot(await loadSnapshotInputs(db, profile.user_id, weekStart));
  }

  const merged = { ...answersFrom(existing?.answers), ...answers };

  const { error } = await db.from("weekly_reviews").upsert(
    {
      user_id: profile.user_id,
      week_start: weekStart,
      snapshot: snapshot as unknown as Json,
      answers: merged as Json,
      next_priority: nextPriority !== undefined ? nextPriority || null : (existing?.next_priority ?? null),
      next_one_thing: nextOneThing !== undefined ? nextOneThing || null : (existing?.next_one_thing ?? null),
      completed_at: complete ? new Date().toISOString() : (existing?.completed_at ?? null),
    },
    { onConflict: "user_id,week_start" },
  );
  if (error) return { error: "Could not save this section. Try again." };

  revalidateReview();
  return { ok: true };
}

/** Section E: rotate the patterns in focus. At most five, enforced here. */
export async function setPatternFocusAction(input: unknown): Promise<ActionState> {
  const parsed = setPatternFocusSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { patternId, inFocus } = parsed.data;

  const profile = await requireProfile();
  const db = await createClient();

  const { data: mine, error: loadError } = await db
    .from("user_patterns")
    .select("id, pattern_id, in_focus")
    .eq("user_id", profile.user_id);
  if (loadError) return { error: "Could not load your patterns. Try again." };

  const current = mine.find((m) => m.pattern_id === patternId);
  const focusCount = mine.filter((m) => m.in_focus && m.pattern_id !== patternId).length;
  if (inFocus && focusCount >= MAX_PATTERNS_IN_FOCUS) {
    return { error: `Five patterns is the limit. Take one out of focus first.` };
  }

  const { error } = current
    ? await db.from("user_patterns").update({ in_focus: inFocus }).eq("id", current.id).eq("user_id", profile.user_id)
    : await db.from("user_patterns").insert({ user_id: profile.user_id, pattern_id: patternId, in_focus: inFocus });
  if (error) return { error: "Could not update that pattern. Try again." };

  revalidateReview();
  revalidatePath("/more/patterns");
  return { ok: true };
}

/** Optional: refresh the frozen numbers for a week from current data. */
export async function recomputeSnapshotAction(input: unknown): Promise<ActionState> {
  const parsed = recomputeSnapshotSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { weekStart } = parsed.data;

  const profile = await requireProfile();
  const weekError = validWeek(weekStart, profile.timezone);
  if (weekError) return { error: weekError };

  const db = await createClient();
  const snapshot = computeSnapshot(await loadSnapshotInputs(db, profile.user_id, weekStart));
  const { error } = await db.from("weekly_reviews").upsert(
    { user_id: profile.user_id, week_start: weekStart, snapshot: snapshot as unknown as Json },
    { onConflict: "user_id,week_start" },
  );
  if (error) return { error: "Could not recompute the numbers. Try again." };

  revalidateReview();
  return { ok: true };
}
