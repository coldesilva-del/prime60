"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, healthLogSchema, healthSettingsSchema, weighInSchema, type ActionState } from "./schemas";

const HEALTH_PATHS = ["/progress", "/progress/health", "/progress/health/log", "/more/health", "/today"];

function revalidateHealth() {
  for (const p of HEALTH_PATHS) revalidatePath(p);
}

/** Track mode: upsert every optional field for the chosen date. */
export async function saveHealthLogAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(
    [
      "date",
      "weight",
      "body_fat",
      "waist",
      "sleep_hours",
      "sleep_quality",
      "training_performance",
      "steps",
      "calories",
      "protein",
      "cardio_calories",
      "notes",
    ].map((k) => [k, formData.get(k) ?? ""]),
  );
  const parsed = healthLogSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { date, ...fields } = parsed.data;
  const { error } = await supabase
    .from("health_metrics")
    .upsert({ user_id: profile.user_id, metric_date: date, ...fields }, { onConflict: "user_id,metric_date" });
  if (error) return { error: "Could not save. Try again." };

  revalidateHealth();
  redirect("/progress/health");
}

/** Coached mode: the weekly reading is weight and body fat only. */
export async function saveWeighInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = weighInSchema.safeParse({
    date: formData.get("date") ?? "",
    weight: formData.get("weight") ?? "",
    body_fat: formData.get("body_fat") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  if (parsed.data.weight === null && parsed.data.body_fat === null) {
    return { error: "Enter a weight or a body fat reading." };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const { date, weight, body_fat } = parsed.data;
  const update: { weight?: number; body_fat?: number } = {};
  if (weight !== null) update.weight = weight;
  if (body_fat !== null) update.body_fat = body_fat;
  const { error } = await supabase
    .from("health_metrics")
    .upsert({ user_id: profile.user_id, metric_date: date, ...update }, { onConflict: "user_id,metric_date" });
  if (error) return { error: "Could not save. Try again." };

  revalidateHealth();
  redirect("/progress/health");
}

/** Mode, hidden fields, targets, programme and weigh-in day in one save. */
export async function saveHealthSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = healthSettingsSchema.safeParse({
    health_mode: formData.get("health_mode"),
    weigh_in_dow: formData.get("weigh_in_dow"),
    hidden_fields: formData.getAll("hidden_fields"),
    starting_weight: formData.get("starting_weight") ?? "",
    target_weight: formData.get("target_weight") ?? "",
    starting_body_fat: formData.get("starting_body_fat") ?? "",
    target_body_fat_low: formData.get("target_body_fat_low") ?? "",
    target_body_fat_high: formData.get("target_body_fat_high") ?? "",
    resistance_per_week: formData.get("resistance_per_week") ?? "",
    cardio_per_week: formData.get("cardio_per_week") ?? "",
    cardio_calories_per_session: formData.get("cardio_calories_per_session") ?? "",
    steps_per_day: formData.get("steps_per_day") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { health_mode, weigh_in_dow, ...targets } = parsed.data;

  const [{ error: profileError }, { error: targetsError }] = await Promise.all([
    supabase.from("profiles").update({ health_mode, weigh_in_dow }).eq("user_id", profile.user_id),
    supabase.from("health_targets").upsert({ user_id: profile.user_id, ...targets }, { onConflict: "user_id" }),
  ]);
  if (profileError || targetsError) return { error: "Could not save. Try again." };

  revalidateHealth();
  return { ok: true };
}
