import { createClient } from "@/lib/supabase/server";
import type { PatternView } from "./schemas";

/**
 * All active library patterns merged with the user's user_patterns rows.
 * Overrides take precedence over library text.
 */
export async function getPatternsForUser(userId: string): Promise<PatternView[]> {
  const supabase = await createClient();
  const [{ data: library, error: libError }, { data: mine, error: mineError }] = await Promise.all([
    supabase.from("pattern_library").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("user_patterns").select("*").eq("user_id", userId),
  ]);
  if (libError) throw new Error(`Could not load patterns: ${libError.message}`);
  if (mineError) throw new Error(`Could not load your patterns: ${mineError.message}`);

  const byPattern = new Map((mine ?? []).map((row) => [row.pattern_id, row]));
  return (library ?? []).map((p) => {
    const u = byPattern.get(p.id);
    return {
      patternId: p.id,
      userPatternId: u?.id ?? null,
      slug: p.slug,
      name: p.name,
      description: p.description,
      replacement: u?.replacement_override?.trim() || p.replacement,
      ifThen: u?.if_then_override?.trim() || p.if_then,
      twoMinuteStart: p.two_minute_start,
      replacementOverride: u?.replacement_override ?? null,
      ifThenOverride: u?.if_then_override ?? null,
      inFocus: u?.in_focus ?? false,
      sortOrder: p.sort_order,
    };
  });
}

export async function getInFocusPatterns(userId: string): Promise<PatternView[]> {
  const all = await getPatternsForUser(userId);
  return all.filter((p) => p.inFocus);
}
