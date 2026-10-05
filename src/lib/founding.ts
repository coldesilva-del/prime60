import "server-only";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const FOUNDING_PLACES = 100;

/**
 * Founding places still unclaimed, or null when the count is unavailable
 * (the landing page then falls back to wording without a number). The counter
 * table is closed to every client role, so this reads it with the service role.
 */
export async function getFoundingPlacesLeft(): Promise<number | null> {
  // A live count: opt the calling page out of build-time prerendering.
  await connection();
  try {
    const admin = createAdminClient();
    // founding_counter is not in the generated types: no client role can read it.
    const { data, error } = await admin
      .from("founding_counter" as never)
      .select("claimed")
      .eq("id", 1)
      .maybeSingle<{ claimed: number }>();
    if (error || !data) return null;
    return Math.max(0, FOUNDING_PLACES - data.claimed);
  } catch {
    return null;
  }
}
