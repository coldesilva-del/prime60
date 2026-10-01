import { createClient } from "@/lib/supabase/server";
import type { HabitStackRow } from "@/lib/supabase/types";

/** All of the user's stacks, active first, in sort order. */
export async function getHabitStacks(userId: string): Promise<HabitStackRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_stacks")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("sort_order")
    .order("id");
  if (error) throw new Error(`Could not load habit stacks: ${error.message}`);
  return data ?? [];
}

export async function getActiveHabitStacks(userId: string): Promise<HabitStackRow[]> {
  const all = await getHabitStacks(userId);
  return all.filter((s) => s.is_active);
}
