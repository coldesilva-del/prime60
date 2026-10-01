import { z } from "zod";
import { isValidTimezone } from "./timezones";

const currentYear = new Date().getUTCFullYear();

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Tell us your first name.").max(60, "Keep it under 60 characters."),
  timezone: z
    .string()
    .trim()
    .min(1, "Choose a timezone.")
    .refine(isValidTimezone, "That timezone is not recognised."),
  targetYear: z.coerce
    .number()
    .int()
    .min(currentYear, "Your Prime Self year is in the future.")
    .max(currentYear + 30, "Keep it within thirty years."),
  birthYear: z
    .union([z.literal(""), z.coerce.number().int().min(1920, "Check the year.").max(currentYear - 16, "Check the year.")])
    .transform((v) => (v === "" ? null : v)),
});

export const preferencesSchema = z.object({
  eveningHour: z.coerce.number().int().min(0).max(23),
  weighInDow: z.coerce.number().int().min(0).max(6),
  activeProjectLimit: z.coerce.number().int().min(1, "At least one.").max(6, "At most six."),
});

export const themeSchema = z.enum(["system", "light", "dark"]);

export const marketingConsentSchema = z.object({ consent: z.boolean() });

export const deleteAccountSchema = z.object({
  confirmation: z.string().trim().refine((v) => v === "DELETE", "Type DELETE to confirm."),
});

export const PILLARS = ["health", "identity", "relationships", "purpose"] as const;
export const PILLAR_LABELS: Record<(typeof PILLARS)[number], string> = {
  health: "Health",
  identity: "Identity",
  relationships: "Relationships",
  purpose: "Purpose",
};
/** The first score key of each pillar, used for custom non-negotiables. */
export const PILLAR_FIRST_KEY: Record<(typeof PILLARS)[number], "h1" | "i1" | "r1" | "p1"> = {
  health: "h1",
  identity: "i1",
  relationships: "r1",
  purpose: "p1",
};

export const nonNegotiableSchema = z
  .object({
    slot: z.coerce.number().int().min(1).max(3),
    catalogueId: z.union([z.literal(""), z.coerce.number().int().positive()]).optional(),
    customLabel: z.string().trim().max(60, "Keep it under 60 characters.").optional(),
    pillar: z.enum(PILLARS).optional(),
  })
  .superRefine((v, ctx) => {
    const hasCatalogue = v.catalogueId !== undefined && v.catalogueId !== "";
    if (!hasCatalogue) {
      if (!v.customLabel) {
        ctx.addIssue({ code: "custom", path: ["customLabel"], message: "Pick one from the list or write your own." });
      }
      if (!v.pillar) {
        ctx.addIssue({ code: "custom", path: ["pillar"], message: "Choose the pillar it belongs to." });
      }
    }
  });

export const identityStatementSchema = z.object({
  body: z.string().trim().min(3, "Write the statement.").max(200, "Keep it under 200 characters."),
});

export const idSchema = z.coerce.number().int().positive();
