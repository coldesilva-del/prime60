"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import { ensureMailchimpSynced } from "./marketing";
import {
  deleteAccountSchema,
  identityStatementSchema,
  idSchema,
  marketingConsentSchema,
  nonNegotiableSchema,
  PILLAR_FIRST_KEY,
  preferencesSchema,
  profileSchema,
  themeSchema,
} from "./schemas";

const ACCOUNT_PATHS = ["/more", "/more/account", "/today"];

function revalidateAccount() {
  for (const p of ACCOUNT_PATHS) revalidatePath(p);
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    timezone: formData.get("timezone"),
    targetYear: formData.get("targetYear"),
    birthYear: formData.get("birthYear") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      timezone: parsed.data.timezone,
      target_year: parsed.data.targetYear,
      birth_year: parsed.data.birthYear,
    })
    .eq("user_id", profile.user_id);
  if (error) return { error: "Could not save. Try again." };

  revalidateAccount();
  return { ok: true };
}

export async function updatePreferencesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = preferencesSchema.safeParse({
    eveningHour: formData.get("eveningHour"),
    weighInDow: formData.get("weighInDow"),
    activeProjectLimit: formData.get("activeProjectLimit"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      evening_hour: parsed.data.eveningHour,
      weigh_in_dow: parsed.data.weighInDow,
      active_project_limit: parsed.data.activeProjectLimit,
    })
    .eq("user_id", profile.user_id);
  if (error) return { error: "Could not save. Try again." };

  revalidateAccount();
  revalidatePath("/plan");
  return { ok: true };
}

/** Saves the theme preference. The picker applies it in the browser first. */
export async function setThemeAction(theme: string): Promise<ActionState> {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { error: "Unknown theme." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ theme: parsed.data }).eq("user_id", profile.user_id);
  if (error) return { error: "Could not save the theme." };

  revalidatePath("/more/account");
  return { ok: true };
}

export async function setMarketingConsentAction(consent: boolean): Promise<ActionState> {
  const parsed = marketingConsentSchema.safeParse({ consent });
  if (!parsed.success) return { error: "Could not read that choice." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      marketing_consent: parsed.data.consent,
      marketing_consent_at: parsed.data.consent ? new Date().toISOString() : profile.marketing_consent_at,
    })
    .eq("user_id", profile.user_id)
    .select("*")
    .single();
  if (error || !data) return { error: "Could not save. Try again." };

  // Best effort; never blocks the response.
  await ensureMailchimpSynced(data);

  revalidatePath("/more/account");
  return { ok: true };
}

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = deleteAccountSchema.safeParse({ confirmation: formData.get("confirmation") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (claimsError || !userId) return { error: "Your session has expired. Sign in and try again." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[account] delete unavailable", err);
    return { error: "Account deletion is not available right now. Email privacy@colindesilva.com and we will do it for you." };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[account] delete failed", error);
    return { error: "Could not delete the account. Try again or email privacy@colindesilva.com." };
  }

  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Non-negotiables
// ---------------------------------------------------------------------------

export async function setNonNegotiableAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = nonNegotiableSchema.safeParse({
    slot: formData.get("slot"),
    catalogueId: formData.get("catalogueId") ?? "",
    customLabel: formData.get("customLabel") ?? "",
    pillar: formData.get("pillar") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { slot } = parsed.data;

  let label: string;
  let pillar: "health" | "identity" | "relationships" | "purpose";
  let scoreKey: "h1" | "h2" | "i1" | "i2" | "r1" | "r2" | "p1" | "p2" | "p3";

  if (parsed.data.catalogueId !== undefined && parsed.data.catalogueId !== "") {
    const { data: item } = await supabase
      .from("non_negotiable_catalogue")
      .select("*")
      .eq("id", parsed.data.catalogueId)
      .eq("is_active", true)
      .maybeSingle();
    if (!item) return { error: "That option is no longer available." };
    label = item.label;
    pillar = item.pillar;
    scoreKey = item.score_key;
  } else {
    label = parsed.data.customLabel!;
    pillar = parsed.data.pillar!;
    scoreKey = PILLAR_FIRST_KEY[pillar];
  }

  // One active row per slot: retire the current one, then insert the new one.
  const { error: deactivateError } = await supabase
    .from("non_negotiables")
    .update({ is_active: false })
    .eq("user_id", profile.user_id)
    .eq("sort_order", slot)
    .eq("is_active", true);
  if (deactivateError) return { error: "Could not update. Try again." };

  const { error: insertError } = await supabase.from("non_negotiables").insert({
    user_id: profile.user_id,
    label,
    pillar,
    score_key: scoreKey,
    sort_order: slot,
    is_active: true,
  });
  if (insertError) return { error: "Could not save. Try again." };

  // Exactly three active, enforced here as well as by the unique slot index.
  const { count } = await supabase
    .from("non_negotiables")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.user_id)
    .eq("is_active", true);
  if ((count ?? 0) > 3) {
    return { error: "Something went wrong keeping three non-negotiables. Reload and try again." };
  }

  revalidatePath("/more/non-negotiables");
  revalidatePath("/today");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Identity statements
// ---------------------------------------------------------------------------

export async function addIdentityStatementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = identityStatementSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();

  const { count } = await supabase
    .from("identity_statements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.user_id);
  const isFirst = (count ?? 0) === 0;

  const { error } = await supabase
    .from("identity_statements")
    .insert({ user_id: profile.user_id, body: parsed.data.body, is_primary: isFirst });
  if (error) return { error: "Could not save. Try again." };

  revalidatePath("/more/identity");
  revalidatePath("/vision");
  return { ok: true };
}

export async function updateIdentityStatementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = idSchema.safeParse(formData.get("id"));
  const parsed = identityStatementSchema.safeParse({ body: formData.get("body") });
  if (!id.success) return { error: "Could not find that statement." };
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("identity_statements")
    .update({ body: parsed.data.body })
    .eq("user_id", profile.user_id)
    .eq("id", id.data);
  if (error) return { error: "Could not save. Try again." };

  revalidatePath("/more/identity");
  revalidatePath("/vision");
  return { ok: true };
}

export async function deleteIdentityStatementAction(id: number): Promise<ActionState> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Could not find that statement." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("identity_statements")
    .delete()
    .eq("user_id", profile.user_id)
    .eq("id", parsedId.data);
  if (error) return { error: "Could not delete. Try again." };

  revalidatePath("/more/identity");
  revalidatePath("/vision");
  return { ok: true };
}

/** Clears the current primary before setting the new one (partial unique index). */
export async function setPrimaryIdentityStatementAction(id: number): Promise<ActionState> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Could not find that statement." };

  const profile = await requireProfile();
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("identity_statements")
    .update({ is_primary: false })
    .eq("user_id", profile.user_id)
    .eq("is_primary", true);
  if (clearError) return { error: "Could not update. Try again." };

  const { error } = await supabase
    .from("identity_statements")
    .update({ is_primary: true })
    .eq("user_id", profile.user_id)
    .eq("id", parsedId.data);
  if (error) return { error: "Could not update. Try again." };

  revalidatePath("/more/identity");
  revalidatePath("/vision");
  revalidatePath("/today");
  return { ok: true };
}
