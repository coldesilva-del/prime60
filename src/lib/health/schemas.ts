import { z } from "zod";
import { HEALTH_FIELDS } from "./progress";

export type { ActionState } from "@/lib/auth/schemas";
export { fieldErrorsFrom } from "@/lib/auth/schemas";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

/** Empty strings become null; anything else must parse as a number. */
function optionalNumber(min: number, max: number, message: string) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number({ error: message }).min(min, message).max(max, message).nullable(),
  );
}

export const healthLogSchema = z.object({
  date: day,
  weight: optionalNumber(20, 400, "Weight should be between 20 and 400 kg."),
  body_fat: optionalNumber(1, 70, "Body fat should be between 1 and 70 percent."),
  waist: optionalNumber(30, 250, "Waist should be between 30 and 250 cm."),
  sleep_hours: optionalNumber(0, 24, "Sleep should be between 0 and 24 hours."),
  sleep_quality: optionalNumber(1, 10, "Sleep quality is 1 to 10."),
  training_performance: optionalNumber(1, 10, "Training performance is 1 to 10."),
  steps: optionalNumber(0, 200000, "Steps should be a whole number."),
  calories: optionalNumber(0, 20000, "Calories should be a whole number."),
  protein: optionalNumber(0, 1000, "Protein should be a whole number of grams."),
  cardio_calories: optionalNumber(0, 10000, "Cardio calories should be a whole number."),
  notes: z
    .string()
    .trim()
    .max(2000, "Keep notes under 2000 characters.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export const weighInSchema = z.object({
  date: day,
  weight: optionalNumber(20, 400, "Weight should be between 20 and 400 kg."),
  body_fat: optionalNumber(1, 70, "Body fat should be between 1 and 70 percent."),
});

export const healthSettingsSchema = z.object({
  health_mode: z.enum(["track", "coached"]),
  weigh_in_dow: z.coerce.number().int().min(0).max(6),
  hidden_fields: z.array(z.enum(HEALTH_FIELDS)).default([]),
  starting_weight: optionalNumber(20, 400, "Weight should be between 20 and 400 kg."),
  target_weight: optionalNumber(20, 400, "Weight should be between 20 and 400 kg."),
  starting_body_fat: optionalNumber(1, 70, "Body fat should be between 1 and 70 percent."),
  target_body_fat_low: optionalNumber(1, 70, "Body fat should be between 1 and 70 percent."),
  target_body_fat_high: optionalNumber(1, 70, "Body fat should be between 1 and 70 percent."),
  resistance_per_week: optionalNumber(0, 14, "Up to 14 sessions a week."),
  cardio_per_week: optionalNumber(0, 14, "Up to 14 sessions a week."),
  cardio_calories_per_session: optionalNumber(0, 5000, "Calories should be a whole number."),
  steps_per_day: optionalNumber(0, 100000, "Steps should be a whole number."),
});

export type HealthLogInput = z.infer<typeof healthLogSchema>;
export type HealthSettingsInput = z.infer<typeof healthSettingsSchema>;
