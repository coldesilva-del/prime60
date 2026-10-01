"use server";

import { revalidatePath } from "next/cache";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { GroupKey, InteractionKind } from "@/lib/supabase/types";
import {
  addPersonSchema,
  fieldErrorsFrom,
  groupLabelSchema,
  logInteractionSchema,
  updatePersonSchema,
  type ActionState,
} from "./schemas";

function revalidatePeople(personId?: number) {
  revalidatePath("/more/people");
  revalidatePath("/progress/relationships");
  revalidatePath("/today");
  if (personId) revalidatePath(`/more/people/${personId}`);
}

/** One tap on the ring: a contact interaction for today. Safe to call twice. */
export async function connectTodayAction(personId: number): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = todayIn(profile.timezone);

  const { data: existing } = await supabase
    .from("interactions")
    .select("id")
    .eq("user_id", profile.user_id)
    .eq("person_id", personId)
    .eq("occurred_on", today)
    .eq("kind", "contact")
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true };

  const { error } = await supabase
    .from("interactions")
    .insert({ user_id: profile.user_id, person_id: personId, occurred_on: today, kind: "contact" });
  if (error) return { error: "Could not record that. Try again." };

  revalidatePeople(personId);
  return { ok: true };
}

export async function renameGroupAction(groupId: number, label: string): Promise<ActionState> {
  const parsed = groupLabelSchema.safeParse(label);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Give the group a name." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("people_groups")
    .update({ label: parsed.data })
    .eq("user_id", profile.user_id)
    .eq("id", groupId);
  if (error) return { error: "Could not rename the group. Try again." };

  revalidatePeople();
  return { ok: true };
}

export async function addPersonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addPersonSchema.safeParse({ group_id: formData.get("group_id"), name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("people_groups")
    .select("id, default_cadence_days")
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.group_id)
    .maybeSingle();
  if (!group) return { error: "That group no longer exists." };

  const { error } = await supabase.from("people").insert({
    user_id: profile.user_id,
    group_id: group.id,
    name: parsed.data.name,
    cadence_days: group.default_cadence_days,
  });
  if (error) return { error: "Could not add them. Try again." };

  revalidatePeople();
  return { ok: true };
}

export async function updatePersonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updatePersonSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    cadence_days: formData.get("cadence_days"),
    is_active: formData.get("is_active") === "true",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { id, ...fields } = parsed.data;
  const { error } = await supabase.from("people").update(fields).eq("user_id", profile.user_id).eq("id", id);
  if (error) return { error: "Could not save. Try again." };

  revalidatePeople(id);
  return { ok: true };
}

export async function logInteractionAction(input: {
  personId: number;
  kind: InteractionKind;
  note?: string | null;
  connectionRating?: number | null;
}): Promise<ActionState> {
  const parsed = logInteractionSchema.safeParse({
    person_id: input.personId,
    kind: input.kind,
    note: input.note ?? null,
    connection_rating: input.connectionRating ?? null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Could not record that." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const today = todayIn(profile.timezone);
  const { error } = await supabase.from("interactions").insert({
    user_id: profile.user_id,
    person_id: parsed.data.person_id,
    occurred_on: today,
    kind: parsed.data.kind,
    note: parsed.data.note ?? null,
    connection_rating: parsed.data.connection_rating ?? null,
  });
  if (error) return { error: "Could not record that. Try again." };

  revalidatePeople(parsed.data.person_id);
  return { ok: true };
}

const DEFAULT_GROUPS: { key: GroupKey; label: string; cadence: number; order: number }[] = [
  { key: "partner", label: "Partner", cadence: 1, order: 1 },
  { key: "children", label: "Children", cadence: 1, order: 2 },
  { key: "family", label: "Family", cadence: 7, order: 3 },
  { key: "friends", label: "Friends", cadence: 14, order: 4 },
  { key: "community", label: "Community", cadence: 30, order: 5 },
];

/** Fallback when onboarding did not seed the five groups. */
export async function seedGroupsAction(): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("people_groups").upsert(
    DEFAULT_GROUPS.map((g) => ({
      user_id: profile.user_id,
      key: g.key,
      label: g.label,
      default_cadence_days: g.cadence,
      sort_order: g.order,
    })),
    { onConflict: "user_id,key", ignoreDuplicates: true },
  );
  if (error) return { error: "Could not set up the groups. Try again." };

  revalidatePeople();
  return { ok: true };
}
