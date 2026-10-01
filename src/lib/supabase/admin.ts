import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export type AdminClient = SupabaseClient<Database>;

/**
 * Service-role client. Bypasses Row Level Security, so it must only be used
 * on the server for: account deletion, the admin screen and the consented
 * email export. Never import this from a client component.
 */
export function createAdminClient(): AdminClient {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to the server environment to enable admin features and account deletion.",
    );
  }
  return createSupabaseClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
