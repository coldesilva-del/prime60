"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { GroupKey, Inserts, NorthStarSection, PeopleGroupRow, ProfileRow } from "@/lib/supabase/types";
import {
  getActiveNonNegotiables,
  getActivePeople,
  getNonNegotiableCatalogue,
  getPatternLibrary,
  getPeopleGroups,
  getUserPatterns,
} from "./queries";
import {
  fieldErrorsFrom,
  identitySchema,
  lifestyleSchema,
  nonNegotiablesSchema,
  northStarSchema,
  parseJsonField,
  patternsSchema,
  peopleSchema,
  welcomeSchema,
  type ActionState,
} from "./schemas";
import {
  COMPLETE_STEP,
  GROUP_DEFAULTS,
  MAX_FOCUS,
  NORTH_STAR_STEPS,
  customScoreKey,
  diffPeople,
  nextOnboardingStep,
  stepHref,
  type StepNumber,
} from "./steps";

const SAVE_ERROR = "Could not save that. Check your connection and try again.";

/** Records progress for a finished step, never moving backwards. */
async function advanceProfile(
  profile: ProfileRow,
  step: StepNumber,
  extra: Partial<Pick<ProfileRow, "first_name" | "target_year" | "birth_year" | "health_mode">> = {},
): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...extra, onboarding_step: nextOnboardingStep(profile.onboarding_step, step) })
    .eq("user_id", profile.user_id);
  return error ? SAVE_ERROR : null;
}

function finishStep(step: StepNumber): never {
  revalidatePath("/welcome", "layout");
  redirect(stepHref(step + 1));
}

// ---------------------------------------------------------------------------
// Step 1: Welcome
// ---------------------------------------------------------------------------

export async function saveWelcomeStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = welcomeSchema.safeParse({
    firstName: formData.get("firstName"),
    targetYear: formData.get("targetYear"),
    birthYear: formData.get("birthYear"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const error = await advanceProfile(profile, 1, {
    first_name: parsed.data.firstName,
    target_year: parsed.data.targetYear,
    birth_year: parsed.data.birthYear ?? null,
  });
  if (error) return { error };
  finishStep(1);
}

// ---------------------------------------------------------------------------
// Steps 2 to 4: North Stars
// ---------------------------------------------------------------------------

async function saveNorthStar(step: 2 | 3 | 4, formData: FormData): Promise<ActionState> {
  const parsed = northStarSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("north_stars")
    .upsert(
      { user_id: profile.user_id, section: NORTH_STAR_STEPS[step].section, body: parsed.data.body },
      { onConflict: "user_id,section" },
    );
  if (error) return { error: SAVE_ERROR };

  const advanceError = await advanceProfile(profile, step);
  if (advanceError) return { error: advanceError };
  revalidatePath("/vision");
  finishStep(step);
}

export async function saveHealthStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return saveNorthStar(2, formData);
}

export async function savePurposeStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return saveNorthStar(3, formData);
}

export async function saveRelationshipsStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return saveNorthStar(4, formData);
}

// ---------------------------------------------------------------------------
// Step 5: Lifestyle and Your Moment (optional)
// ---------------------------------------------------------------------------

export async function saveLifestyleStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = lifestyleSchema.safeParse({
    lifestyle: formData.get("lifestyle") ?? "",
    moment: formData.get("moment") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const rows: Inserts<"north_stars">[] = (
    [
      ["lifestyle", parsed.data.lifestyle],
      ["moment", parsed.data.moment],
    ] as [NorthStarSection, string][]
  ).map(([section, body]) => ({ user_id: profile.user_id, section, body }));

  const { error } = await supabase.from("north_stars").upsert(rows, { onConflict: "user_id,section" });
  if (error) return { error: SAVE_ERROR };

  const advanceError = await advanceProfile(profile, 5);
  if (advanceError) return { error: advanceError };
  revalidatePath("/vision");
  finishStep(5);
}

export async function skipLifestyleStep(): Promise<ActionState> {
  const profile = await requireProfile();
  const error = await advanceProfile(profile, 5);
  if (error) return { error };
  finishStep(5);
}

// ---------------------------------------------------------------------------
// Step 6: Old patterns
// ---------------------------------------------------------------------------

export async function savePatternsStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const payload = parseJsonField(formData.get("payload"));
  if (!payload) return { error: "Choose your patterns and try again." };
  const parsed = patternsSchema.safeParse(payload);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const [library, existing] = await Promise.all([getPatternLibrary(), getUserPatterns(profile.user_id)]);
  const libraryIds = new Set(library.map((p) => p.id));
  const focus = new Set(parsed.data.focusIds.filter((id) => libraryIds.has(id)));
  if (focus.size > MAX_FOCUS) return { fieldErrors: { focusIds: `Choose no more than ${MAX_FOCUS} patterns.` } };
  if (focus.size !== parsed.data.focusIds.length) {
    return { fieldErrors: { focusIds: "One of those patterns is no longer available. Choose again." } };
  }

  const existingById = new Map(existing.map((row) => [row.pattern_id, row]));
  const rows: Inserts<"user_patterns">[] = library.map((pattern) => {
    const inFocus = focus.has(pattern.id);
    const override = parsed.data.overrides[String(pattern.id)];
    const previous = existingById.get(pattern.id);
    const pick = (edited: string | undefined, fallback: string, keep: string | null) => {
      if (!inFocus) return keep;
      if (edited === undefined) return keep;
      const value = edited.trim();
      return value === "" || value === fallback ? null : value;
    };
    return {
      user_id: profile.user_id,
      pattern_id: pattern.id,
      in_focus: inFocus,
      replacement_override: pick(override?.replacement, pattern.replacement, previous?.replacement_override ?? null),
      if_then_override: pick(override?.ifThen, pattern.if_then, previous?.if_then_override ?? null),
    };
  });

  const supabase = await createClient();
  const { error } = await supabase.from("user_patterns").upsert(rows, { onConflict: "user_id,pattern_id" });
  if (error) return { error: SAVE_ERROR };

  const advanceError = await advanceProfile(profile, 6);
  if (advanceError) return { error: advanceError };
  revalidatePath("/more/patterns");
  finishStep(6);
}

// ---------------------------------------------------------------------------
// Step 7: People
// ---------------------------------------------------------------------------

async function ensurePeopleGroups(userId: string): Promise<PeopleGroupRow[]> {
  const existing = await getPeopleGroups(userId);
  const have = new Set(existing.map((g) => g.key));
  const missing: Inserts<"people_groups">[] = GROUP_DEFAULTS.filter((g) => !have.has(g.key)).map((g) => ({
    user_id: userId,
    key: g.key,
    label: g.label,
    default_cadence_days: g.cadence,
    sort_order: g.sortOrder,
  }));
  if (missing.length === 0) return existing;

  const supabase = await createClient();
  const { error } = await supabase.from("people_groups").insert(missing);
  if (error) throw new Error(`Could not create people groups: ${error.message}`);
  return getPeopleGroups(userId);
}

export async function savePeopleStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const payload = parseJsonField(formData.get("payload"));
  if (!payload) return { error: "Something went wrong with the list. Try again." };
  const parsed = peopleSchema.safeParse(payload);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  let groups: PeopleGroupRow[];
  try {
    groups = await ensurePeopleGroups(profile.user_id);
  } catch {
    return { error: SAVE_ERROR };
  }
  const groupIdByKey = new Map<GroupKey, number>(groups.map((g) => [g.key, g.id]));

  const existing = await getActivePeople(profile.user_id);
  const diff = diffPeople(
    existing.map((p) => p.id),
    parsed.data.people,
  );

  const supabase = await createClient();

  if (diff.deactivateIds.length > 0) {
    const { error } = await supabase
      .from("people")
      .update({ is_active: false })
      .eq("user_id", profile.user_id)
      .in("id", diff.deactivateIds);
    if (error) return { error: SAVE_ERROR };
  }

  for (const person of diff.update) {
    const groupId = groupIdByKey.get(person.group);
    if (!groupId) continue;
    const { error } = await supabase
      .from("people")
      .update({ name: person.name, cadence_days: person.cadenceDays, group_id: groupId, is_active: true })
      .eq("user_id", profile.user_id)
      .eq("id", person.id);
    if (error) return { error: SAVE_ERROR };
  }

  const inserts: Inserts<"people">[] = [];
  for (const person of diff.insert) {
    const groupId = groupIdByKey.get(person.group);
    if (!groupId) continue;
    inserts.push({ user_id: profile.user_id, group_id: groupId, name: person.name, cadence_days: person.cadenceDays });
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from("people").insert(inserts);
    if (error) return { error: SAVE_ERROR };
  }

  const advanceError = await advanceProfile(profile, 7);
  if (advanceError) return { error: advanceError };
  revalidatePath("/more/people");
  finishStep(7);
}

// ---------------------------------------------------------------------------
// Step 8: Non-negotiables
// ---------------------------------------------------------------------------

export async function saveNonNegotiablesStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const payload = parseJsonField(formData.get("payload"));
  if (!payload) return { error: "Choose three non-negotiables and try again." };
  const parsed = nonNegotiablesSchema.safeParse(payload);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const catalogue = await getNonNegotiableCatalogue();
  const chosen = catalogue.filter((item) => parsed.data.catalogueIds.includes(item.id));
  if (chosen.length !== parsed.data.catalogueIds.length) {
    return { fieldErrors: { catalogueIds: "One of those is no longer available. Choose again." } };
  }

  const rows: Inserts<"non_negotiables">[] = chosen.map((item, index) => ({
    user_id: profile.user_id,
    label: item.label,
    pillar: item.pillar,
    score_key: item.score_key,
    sort_order: index + 1,
  }));
  if (parsed.data.custom) {
    rows.push({
      user_id: profile.user_id,
      label: parsed.data.custom.label,
      pillar: parsed.data.custom.pillar,
      score_key: customScoreKey(parsed.data.custom.pillar),
      sort_order: rows.length + 1,
    });
  }

  const supabase = await createClient();
  const active = await getActiveNonNegotiables(profile.user_id);
  if (active.length > 0) {
    const { error } = await supabase
      .from("non_negotiables")
      .update({ is_active: false })
      .eq("user_id", profile.user_id)
      .in(
        "id",
        active.map((row) => row.id),
      );
    if (error) return { error: SAVE_ERROR };
  }
  const { error } = await supabase.from("non_negotiables").insert(rows);
  if (error) return { error: SAVE_ERROR };

  const advanceError = await advanceProfile(profile, 8);
  if (advanceError) return { error: advanceError };
  revalidatePath("/more/non-negotiables");
  finishStep(8);
}

// ---------------------------------------------------------------------------
// Step 9: Identity and health mode, then completion
// ---------------------------------------------------------------------------

export async function saveIdentityStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = identitySchema.safeParse({
    statement: formData.get("statement"),
    healthMode: formData.get("healthMode"),
    startingWeight: formData.get("startingWeight"),
    targetWeight: formData.get("targetWeight"),
    targetBodyFatLow: formData.get("targetBodyFatLow"),
    targetBodyFatHigh: formData.get("targetBodyFatHigh"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();

  // One primary statement. Update it in place when it exists so going back
  // and saving again does not leave a trail of rows.
  const { data: primary, error: primaryError } = await supabase
    .from("identity_statements")
    .select("id")
    .eq("user_id", profile.user_id)
    .eq("is_primary", true)
    .maybeSingle();
  if (primaryError) return { error: SAVE_ERROR };

  if (primary) {
    const { error } = await supabase
      .from("identity_statements")
      .update({ body: parsed.data.statement })
      .eq("user_id", profile.user_id)
      .eq("id", primary.id);
    if (error) return { error: SAVE_ERROR };
  } else {
    const { error } = await supabase
      .from("identity_statements")
      .insert({ user_id: profile.user_id, body: parsed.data.statement, is_primary: true });
    if (error) return { error: SAVE_ERROR };
  }

  const { startingWeight, targetWeight, targetBodyFatLow, targetBodyFatHigh } = parsed.data;
  const hasTargets = [startingWeight, targetWeight, targetBodyFatLow, targetBodyFatHigh].some((v) => v !== undefined);
  if (hasTargets) {
    const { error } = await supabase.from("health_targets").upsert(
      {
        user_id: profile.user_id,
        starting_weight: startingWeight ?? null,
        target_weight: targetWeight ?? null,
        target_body_fat_low: targetBodyFatLow ?? null,
        target_body_fat_high: targetBodyFatHigh ?? null,
      },
      { onConflict: "user_id" },
    );
    if (error) return { error: SAVE_ERROR };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      health_mode: parsed.data.healthMode,
      onboarding_step: COMPLETE_STEP,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", profile.user_id);
  if (profileError) return { error: SAVE_ERROR };

  revalidatePath("/", "layout");
  if (serverEnv().SKOOL_INVITE_URL) redirect("/welcome/community");
  redirect("/today");
}

/** Both community buttons record that the invitation was shown, then go to Today. */
export async function markCommunitySeen(): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ skool_link_seen_at: new Date().toISOString() })
    .eq("user_id", profile.user_id);
  revalidatePath("/today");
  redirect("/today");
}
