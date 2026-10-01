import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type UserTable = keyof Database["public"]["Tables"];

/** Every table that carries a user_id column. Order matches the data model. */
const USER_TABLES: UserTable[] = [
  "profiles",
  "north_stars",
  "identity_statements",
  "roadmap_items",
  "vision_images",
  "non_negotiables",
  "daily_entries",
  "daily_commitments",
  "user_patterns",
  "pattern_occurrences",
  "courage_reps",
  "habit_stacks",
  "stuck_sessions",
  "ideas",
  "projects",
  "project_status_history",
  "people_groups",
  "people",
  "interactions",
  "health_targets",
  "health_metrics",
  "weekly_reviews",
  "cycles",
  "objectives",
];

/**
 * Export my data. Uses the normal server client so Row Level Security applies;
 * the explicit user_id filter keeps the intent obvious.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });

  const { data: user } = await supabase.auth.getUser();

  const tables: Record<string, unknown[]> = {};
  for (const table of USER_TABLES) {
    // Every table in the list carries user_id; the cast picks one concrete
    // builder so the column filter type-checks across the union.
    const { data, error } = await supabase
      .from(table as "profiles")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: `Could not read ${table}.` }, { status: 500 });
    }
    tables[table] = data ?? [];
  }

  const body = {
    product: "Prime 60",
    format: 1,
    exported_at: new Date().toISOString(),
    account: { id: userId, email: user.user?.email ?? null },
    tables,
  };

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="prime60-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
