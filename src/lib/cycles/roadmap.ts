import type { createClient } from "@/lib/supabase/server";
import type { Pillar, RoadmapItemRow } from "@/lib/supabase/types";
import { PILLAR_LABELS, PILLAR_ORDER } from "./dates";
import { ROADMAP_HORIZONS, type RoadmapHorizon } from "./schemas";

type Db = Awaited<ReturnType<typeof createClient>>;

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Could not load ${what}: ${error?.message ?? "unknown error"}`);
}

export type RoadmapByHorizon = Record<RoadmapHorizon, RoadmapItemRow[]>;

export async function getRoadmapItems(db: Db, userId: string): Promise<RoadmapByHorizon> {
  const { data, error } = await db
    .from("roadmap_items")
    .select("*")
    .eq("user_id", userId)
    .in("horizon", [...ROADMAP_HORIZONS])
    .order("sort_order")
    .order("id");
  if (error) fail("the roadmap", error);
  const out: RoadmapByHorizon = { "1y": [], "3y": [], "5y": [] };
  for (const row of data) {
    if (row.horizon in out) out[row.horizon as RoadmapHorizon].push(row);
  }
  return out;
}

/** Today's one thing from the morning check-in, if set. */
export async function getTodayOneThing(db: Db, userId: string, today: string): Promise<string | null> {
  const { data, error } = await db
    .from("daily_entries")
    .select("one_thing")
    .eq("user_id", userId)
    .eq("entry_date", today)
    .maybeSingle();
  if (error) fail("today's entry", error);
  const text = data?.one_thing?.trim();
  return text ? text : null;
}

/** First sentence of a block of text, for the one-line summary. */
export function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

export interface NorthStarSummary {
  section: Pillar;
  label: string;
  line: string;
}

/** One line per pillar from the North Star, for the five-year row. */
export async function getNorthStarSummaries(db: Db, userId: string): Promise<NorthStarSummary[]> {
  const { data, error } = await db
    .from("north_stars")
    .select("section, body")
    .eq("user_id", userId)
    .in("section", PILLAR_ORDER);
  if (error) fail("the North Star", error);
  const bySection = new Map(data.map((r) => [r.section, r.body]));
  return PILLAR_ORDER.flatMap((p) => {
    const line = firstSentence(bySection.get(p) ?? "");
    return line ? [{ section: p, label: PILLAR_LABELS[p], line }] : [];
  });
}
