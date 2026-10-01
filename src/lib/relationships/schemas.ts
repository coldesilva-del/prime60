import { z } from "zod";

export type { ActionState } from "@/lib/auth/schemas";
export { fieldErrorsFrom } from "@/lib/auth/schemas";

export const INTERACTION_KIND_VALUES = ["contact", "quality_time", "support", "conversation", "gratitude", "note"] as const;

export const personNameSchema = z.string().trim().min(1, "Give them a name.").max(80, "Keep the name under 80 characters.");

export const groupLabelSchema = z.string().trim().min(1, "Give the group a name.").max(40, "Keep it under 40 characters.");

export const addPersonSchema = z.object({
  group_id: z.coerce.number().int().positive(),
  name: personNameSchema,
});

export const updatePersonSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: personNameSchema,
  cadence_days: z.coerce.number().int().min(1).max(365),
  is_active: z.boolean(),
});

export const logInteractionSchema = z.object({
  person_id: z.coerce.number().int().positive(),
  kind: z.enum(INTERACTION_KIND_VALUES),
  note: z
    .string()
    .trim()
    .max(1000, "Keep the note under 1000 characters.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  connection_rating: z.number().int().min(1).max(10).nullable().optional(),
});
