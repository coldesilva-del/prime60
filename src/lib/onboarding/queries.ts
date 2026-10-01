import { createClient } from "@/lib/supabase/server";
import type {
  HealthTargetsRow,
  NonNegotiableCatalogueRow,
  NonNegotiableRow,
  NorthStarRow,
  NorthStarSection,
  PatternLibraryRow,
  PeopleGroupRow,
  PersonRow,
  UserPatternRow,
} from "@/lib/supabase/types";

/**
 * Reads used to prefill onboarding steps. Every query is scoped by user_id
 * even though RLS enforces it.
 */

export async function getNorthStars(userId: string, sections: NorthStarSection[]): Promise<Partial<Record<NorthStarSection, string>>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("north_stars")
    .select("section, body")
    .eq("user_id", userId)
    .in("section", sections);
  if (error) throw new Error(`Could not load North Stars: ${error.message}`);
  const out: Partial<Record<NorthStarSection, string>> = {};
  for (const row of (data ?? []) as Pick<NorthStarRow, "section" | "body">[]) out[row.section] = row.body;
  return out;
}

export async function getPatternLibrary(): Promise<PatternLibraryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pattern_library")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load the pattern library: ${error.message}`);
  return data ?? [];
}

export async function getUserPatterns(userId: string): Promise<UserPatternRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_patterns").select("*").eq("user_id", userId);
  if (error) throw new Error(`Could not load your patterns: ${error.message}`);
  return data ?? [];
}

export async function getPeopleGroups(userId: string): Promise<PeopleGroupRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people_groups")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load people groups: ${error.message}`);
  return data ?? [];
}

export async function getActivePeople(userId: string): Promise<PersonRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load people: ${error.message}`);
  return data ?? [];
}

export async function getNonNegotiableCatalogue(): Promise<NonNegotiableCatalogueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("non_negotiable_catalogue")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`);
  return data ?? [];
}

export async function getActiveNonNegotiables(userId: string): Promise<NonNegotiableRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("non_negotiables")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load non-negotiables: ${error.message}`);
  return data ?? [];
}

export async function getPrimaryIdentityStatement(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("identity_statements")
    .select("body")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load your identity statement: ${error.message}`);
  return data?.body ?? null;
}

export async function getHealthTargets(userId: string): Promise<HealthTargetsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("health_targets").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Could not load health targets: ${error.message}`);
  return data ?? null;
}
