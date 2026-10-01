import { createClient } from "@/lib/supabase/server";
import type { CourageRepTypeRow } from "@/lib/supabase/types";

export async function getCourageRepTypes(): Promise<CourageRepTypeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courage_rep_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Could not load Courage Rep types: ${error.message}`);
  return data ?? [];
}
