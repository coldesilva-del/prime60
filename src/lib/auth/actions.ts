"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import {
  emailOnlySchema,
  fieldErrorsFrom,
  safeNext,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type ActionState,
} from "./schemas";

const appUrl = publicEnv.NEXT_PUBLIC_APP_URL;

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) {
    return "That email already has an account. Sign in instead.";
  }
  if (m.includes("invalid login credentials")) {
    return "That email and password do not match.";
  }
  if (m.includes("email not confirmed")) {
    return "Your email is not verified yet. Check your inbox for the link.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "Something went wrong. Try again.";
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    firstName: formData.get("firstName"),
    email: formData.get("email"),
    password: formData.get("password"),
    marketingConsent: formData.get("marketingConsent") === "on",
    acceptTerms: formData.get("acceptTerms") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/welcome/1`,
      data: {
        first_name: parsed.data.firstName,
        marketing_consent: parsed.data.marketingConsent,
      },
    },
  });
  if (error) return { error: friendlyAuthError(error.message) };

  redirect(`/check-email?purpose=verify&email=${encodeURIComponent(parsed.data.email)}`);
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: friendlyAuthError(error.message) };

  redirect(safeNext(parsed.data.next));
}

export async function magicLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/today`,
      shouldCreateUser: false,
    },
  });
  // Do not reveal whether the email exists.
  if (error && !error.message.toLowerCase().includes("signups not allowed")) {
    return { error: friendlyAuthError(error.message) };
  }
  redirect(`/check-email?purpose=magic&email=${encodeURIComponent(parsed.data.email)}`);
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/update-password`,
  });
  // Always succeed from the user's point of view.
  redirect(`/check-email?purpose=reset&email=${encodeURIComponent(parsed.data.email)}`);
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyAuthError(error.message) };

  redirect("/today");
}

export async function resendVerificationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${appUrl}/auth/callback?next=/welcome/1` },
  });
  if (error) return { error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
