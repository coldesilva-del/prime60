import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";

/**
 * Loads the signed-in user's profile once per request.
 * Redirects to sign-in when there is no session.
 */
export const requireProfile = cache(async (): Promise<ProfileRow> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) redirect("/sign-in");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Could not load profile: ${error.message}`);
  if (!data) {
    // The trigger creates the row at sign-up; a missing row means the user was
    // created outside the normal flow. Create a minimal profile so they can continue.
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({ user_id: userId })
      .select("*")
      .single();
    if (insertError || !created) throw new Error("Could not create profile");
    return created;
  }
  return data;
});

export const ONBOARDING_STEPS = 9;

export function onboardingComplete(profile: ProfileRow): boolean {
  return profile.onboarding_completed_at !== null;
}
