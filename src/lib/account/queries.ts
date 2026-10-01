import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { IdentityStatementRow, NonNegotiableCatalogueRow, NonNegotiableRow } from "@/lib/supabase/types";

/** The three standing non-negotiables, in slot order. Missing slots are null. */
export const getStandingNonNegotiables = cache(
  async (userId: string): Promise<(NonNegotiableRow | null)[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("non_negotiables")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(`Could not load non-negotiables: ${error.message}`);
    const slots: (NonNegotiableRow | null)[] = [null, null, null];
    for (const row of data ?? []) {
      if (row.sort_order >= 1 && row.sort_order <= 3) slots[row.sort_order - 1] = row;
    }
    return slots;
  },
);

export const getNonNegotiableCatalogue = cache(async (): Promise<NonNegotiableCatalogueRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("non_negotiable_catalogue")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`);
  return data ?? [];
});

export const getIdentityStatements = cache(async (userId: string): Promise<IdentityStatementRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("identity_statements")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at");
  if (error) throw new Error(`Could not load identity statements: ${error.message}`);
  return data ?? [];
});

/** Signed-in user's email from the auth server, or null. */
export const getUserEmail = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
});
