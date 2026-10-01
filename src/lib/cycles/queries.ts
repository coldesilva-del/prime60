import type { createClient } from "@/lib/supabase/server";
import type { CycleRow, ObjectiveRow } from "@/lib/supabase/types";

type Db = Awaited<ReturnType<typeof createClient>>;

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Could not load ${what}: ${error?.message ?? "unknown error"}`);
}

export async function getActiveCycle(db: Db, userId: string): Promise<CycleRow | null> {
  const { data, error } = await db
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) fail("the active cycle", error);
  return data;
}

export async function getCycle(db: Db, userId: string, cycleId: number): Promise<CycleRow | null> {
  const { data, error } = await db.from("cycles").select("*").eq("user_id", userId).eq("id", cycleId).maybeSingle();
  if (error) fail("the cycle", error);
  return data;
}

export async function getCycleObjectives(db: Db, userId: string, cycleId: number): Promise<ObjectiveRow[]> {
  const { data, error } = await db
    .from("objectives")
    .select("*")
    .eq("user_id", userId)
    .eq("cycle_id", cycleId)
    .order("sort_order")
    .order("id");
  if (error) fail("objectives", error);
  return data;
}

export async function getObjective(db: Db, userId: string, id: number): Promise<ObjectiveRow | null> {
  const { data, error } = await db.from("objectives").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  if (error) fail("the objective", error);
  return data;
}

/** The most recently closed cycle, used to carry objectives into the next one. */
export async function getLatestClosedCycle(db: Db, userId: string): Promise<CycleRow | null> {
  const { data, error } = await db
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "closed")
    .order("ends_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail("past cycles", error);
  return data;
}

export async function getActiveCycleWithObjectives(db: Db, userId: string) {
  const cycle = await getActiveCycle(db, userId);
  if (!cycle) return null;
  const objectives = await getCycleObjectives(db, userId, cycle.id);
  return { cycle, objectives };
}
