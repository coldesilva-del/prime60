"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import type { ActionState } from "@/lib/patterns/schemas";
import {
  habitStackIdSchema,
  habitStackMoveSchema,
  habitStackSchema,
  habitStackUpdateSchema,
  MAX_ACTIVE_STACKS,
} from "./schemas";

const STACK_PATHS = ["/today", "/more/habit-stacks"];

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function activeCount(userId: string, excludeId?: number): Promise<number> {
  const supabase = await createClient();
  let q = supabase
    .from("habit_stacks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);
  if (excludeId) q = q.neq("id", excludeId);
  const { count } = await q;
  return count ?? 0;
}

export async function addHabitStackAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = habitStackSchema.safeParse({
    anchor: formData.get("anchor"),
    behaviour: formData.get("behaviour"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const profile = await requireProfile();
  if ((await activeCount(profile.user_id)) >= MAX_ACTIVE_STACKS) {
    return { error: "Eight is the limit. Deactivate one first." };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("habit_stacks")
    .select("sort_order")
    .eq("user_id", profile.user_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("habit_stacks").insert({
    user_id: profile.user_id,
    anchor: parsed.data.anchor,
    behaviour: parsed.data.behaviour,
    sort_order: (last?.sort_order ?? 0) + 1,
    is_active: true,
  });
  if (error) return { error: "Could not add the stack. Try again." };

  for (const p of STACK_PATHS) revalidatePath(p);
  return { ok: true };
}

export async function updateHabitStackAction(input: {
  id: number;
  anchor: string;
  behaviour: string;
}): Promise<ActionState> {
  const parsed = habitStackUpdateSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("habit_stacks")
    .update({ anchor: parsed.data.anchor, behaviour: parsed.data.behaviour })
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.id);
  if (error) return { error: "Could not save. Try again." };

  for (const p of STACK_PATHS) revalidatePath(p);
  return { ok: true };
}

export async function setHabitStackActiveAction(input: { id: number; active: boolean }): Promise<ActionState> {
  const parsed = habitStackIdSchema.safeParse({ id: input.id });
  if (!parsed.success) return { error: "Something went wrong. Try again." };

  const profile = await requireProfile();
  if (input.active && (await activeCount(profile.user_id, parsed.data.id)) >= MAX_ACTIVE_STACKS) {
    return { error: "Eight is the limit. Deactivate one first." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("habit_stacks")
    .update({ is_active: input.active })
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.id);
  if (error) return { error: "Could not update. Try again." };

  for (const p of STACK_PATHS) revalidatePath(p);
  return { ok: true };
}

/** Swap sort_order with the neighbour above or below among active stacks. */
export async function moveHabitStackAction(input: { id: number; direction: "up" | "down" }): Promise<ActionState> {
  const parsed = habitStackMoveSchema.safeParse(input);
  if (!parsed.success) return { error: "Something went wrong. Try again." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("habit_stacks")
    .select("id, sort_order")
    .eq("user_id", profile.user_id)
    .eq("is_active", true)
    .order("sort_order")
    .order("id");
  if (error || !rows) return { error: "Could not reorder. Try again." };

  const index = rows.findIndex((r) => r.id === parsed.data.id);
  if (index < 0) return { error: "That stack is not active." };
  const target = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return { ok: true };

  // Normalise to 1..n so swaps are always meaningful even if sort_order has gaps or ties.
  const ordered = rows.map((r, i) => ({ id: r.id, sort_order: i + 1 }));
  const a = ordered[index];
  const b = ordered[target];
  [a.sort_order, b.sort_order] = [b.sort_order, a.sort_order];

  const results = await Promise.all(
    ordered.map((r) =>
      supabase.from("habit_stacks").update({ sort_order: r.sort_order }).eq("user_id", profile.user_id).eq("id", r.id),
    ),
  );
  if (results.some((r) => r.error)) return { error: "Could not reorder. Try again." };

  for (const p of STACK_PATHS) revalidatePath(p);
  return { ok: true };
}
