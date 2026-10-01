"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import { getSnippets } from "@/lib/content";
import { getPatternsForUser } from "./queries";
import {
  logPatternSchema,
  occurrenceDetailSchema,
  overridesSchema,
  setInFocusSchema,
  MAX_IN_FOCUS,
  type ActionState,
  type OccurrenceDetailInput,
  type PatternView,
} from "./schemas";

const PATTERN_PATHS = ["/today", "/more/patterns", "/progress"];

/** Everything the quick-log sheet needs, in one round trip. */
export async function loadPatternSheet(): Promise<{ patterns: PatternView[]; loggedLine: string }> {
  const profile = await requireProfile();
  const [patterns, snippets] = await Promise.all([
    getPatternsForUser(profile.user_id),
    getSnippets(["pattern_logged_line"]),
  ]);
  return { patterns, loggedLine: snippets.pattern_logged_line };
}

/**
 * Two-tap log. Creates the user_patterns row on first use so patterns outside
 * the five in focus can still be logged.
 */
export async function logPatternAction(input: {
  patternId: number;
  response: "followed" | "replaced";
}): Promise<ActionState & { occurrenceId?: number }> {
  const parsed = logPatternSchema.safeParse(input);
  if (!parsed.success) return { error: "Pick a pattern and what happened." };

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_patterns")
    .select("id")
    .eq("user_id", profile.user_id)
    .eq("pattern_id", parsed.data.patternId)
    .maybeSingle();

  let userPatternId = existing?.id ?? null;
  if (!userPatternId) {
    const { data: created, error } = await supabase
      .from("user_patterns")
      .insert({ user_id: profile.user_id, pattern_id: parsed.data.patternId, in_focus: false })
      .select("id")
      .single();
    if (error || !created) return { error: "Could not save that pattern. Try again." };
    userPatternId = created.id;
  }

  const { data: occurrence, error } = await supabase
    .from("pattern_occurrences")
    .insert({
      user_id: profile.user_id,
      user_pattern_id: userPatternId,
      occurred_on: todayIn(profile.timezone),
      response: parsed.data.response,
    })
    .select("id")
    .single();
  if (error || !occurrence) return { error: "Could not log that. Try again." };

  for (const p of PATTERN_PATHS) revalidatePath(p);
  return { ok: true, occurrenceId: occurrence.id };
}

/** Optional detail added after the two-tap log. Nothing is required. */
export async function updateOccurrenceDetailAction(input: OccurrenceDetailInput): Promise<ActionState> {
  const parsed = occurrenceDetailSchema.safeParse(input);
  if (!parsed.success) return { error: "Keep each answer under 1000 characters." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { occurrenceId, ...fields } = parsed.data;
  const { error } = await supabase
    .from("pattern_occurrences")
    .update(fields)
    .eq("user_id", profile.user_id)
    .eq("id", occurrenceId);
  if (error) return { error: "Could not save the detail. Try again." };
  return { ok: true };
}

/** In-focus toggle. At most five in focus, enforced here. */
export async function setPatternInFocusAction(input: { patternId: number; inFocus: boolean }): Promise<ActionState> {
  const parsed = setInFocusSchema.safeParse(input);
  if (!parsed.success) return { error: "Something went wrong. Try again." };

  const profile = await requireProfile();
  const supabase = await createClient();

  if (parsed.data.inFocus) {
    const { count } = await supabase
      .from("user_patterns")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("in_focus", true)
      .neq("pattern_id", parsed.data.patternId);
    if ((count ?? 0) >= MAX_IN_FOCUS) {
      return { error: "Five is the limit. Take one out of focus first." };
    }
  }

  const { error } = await supabase.from("user_patterns").upsert(
    { user_id: profile.user_id, pattern_id: parsed.data.patternId, in_focus: parsed.data.inFocus },
    { onConflict: "user_id,pattern_id" },
  );
  if (error) return { error: "Could not update focus. Try again." };

  for (const p of PATTERN_PATHS) revalidatePath(p);
  return { ok: true };
}

/** Replacement and IF-THEN overrides. Empty text clears the override. */
export async function updatePatternOverridesAction(input: {
  patternId: number;
  replacementOverride?: string | null;
  ifThenOverride?: string | null;
}): Promise<ActionState> {
  const parsed = overridesSchema.safeParse(input);
  if (!parsed.success) return { error: "Keep each line under 1000 characters." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("user_patterns").upsert(
    {
      user_id: profile.user_id,
      pattern_id: parsed.data.patternId,
      replacement_override: parsed.data.replacementOverride ?? null,
      if_then_override: parsed.data.ifThenOverride ?? null,
    },
    { onConflict: "user_id,pattern_id" },
  );
  if (error) return { error: "Could not save. Try again." };

  for (const p of PATTERN_PATHS) revalidatePath(p);
  return { ok: true };
}
