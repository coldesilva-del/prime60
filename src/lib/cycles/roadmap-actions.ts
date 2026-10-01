"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import {
  addRoadmapItemSchema,
  moveRoadmapItemSchema,
  removeRoadmapItemSchema,
  updateRoadmapItemSchema,
} from "./schemas";

const ROADMAP_PATH = "/plan/roadmap";

export async function addRoadmapItemAction(input: unknown): Promise<ActionState> {
  const parsed = addRoadmapItemSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const profile = await requireProfile();
  const db = await createClient();

  const { data: last } = await db
    .from("roadmap_items")
    .select("sort_order")
    .eq("user_id", profile.user_id)
    .eq("horizon", parsed.data.horizon)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("roadmap_items").insert({
    user_id: profile.user_id,
    horizon: parsed.data.horizon,
    body: parsed.data.body,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { error: "Could not add that line. Try again." };
  revalidatePath(ROADMAP_PATH);
  return { ok: true };
}

export async function updateRoadmapItemAction(input: unknown): Promise<ActionState> {
  const parsed = updateRoadmapItemSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const profile = await requireProfile();
  const db = await createClient();
  const { error } = await db
    .from("roadmap_items")
    .update({ body: parsed.data.body })
    .eq("id", parsed.data.id)
    .eq("user_id", profile.user_id);
  if (error) return { error: "Could not save that line. Try again." };
  revalidatePath(ROADMAP_PATH);
  return { ok: true };
}

export async function removeRoadmapItemAction(input: unknown): Promise<ActionState> {
  const parsed = removeRoadmapItemSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const profile = await requireProfile();
  const db = await createClient();
  const { error } = await db.from("roadmap_items").delete().eq("id", parsed.data.id).eq("user_id", profile.user_id);
  if (error) return { error: "Could not remove that line. Try again." };
  revalidatePath(ROADMAP_PATH);
  return { ok: true };
}

/** Swaps the item with its neighbour and renumbers the horizon 0..n. */
export async function moveRoadmapItemAction(input: unknown): Promise<ActionState> {
  const parsed = moveRoadmapItemSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const profile = await requireProfile();
  const db = await createClient();

  const { data: item, error: itemError } = await db
    .from("roadmap_items")
    .select("id, horizon")
    .eq("id", parsed.data.id)
    .eq("user_id", profile.user_id)
    .maybeSingle();
  if (itemError || !item) return { error: "That line no longer exists." };

  const { data: siblings, error: listError } = await db
    .from("roadmap_items")
    .select("id, sort_order")
    .eq("user_id", profile.user_id)
    .eq("horizon", item.horizon)
    .order("sort_order")
    .order("id");
  if (listError) return { error: "Could not reorder. Try again." };

  const ids = siblings.map((s) => s.id);
  const index = ids.indexOf(item.id);
  const target = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return { ok: true };
  [ids[index], ids[target]] = [ids[target], ids[index]];

  for (let i = 0; i < ids.length; i++) {
    const { error } = await db
      .from("roadmap_items")
      .update({ sort_order: i })
      .eq("id", ids[i])
      .eq("user_id", profile.user_id);
    if (error) return { error: "Could not reorder. Try again." };
  }
  revalidatePath(ROADMAP_PATH);
  return { ok: true };
}
