import { z } from "zod";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import {
  GROUP_KEYS,
  MAX_FOCUS,
  MIN_FOCUS,
  NON_NEGOTIABLE_COUNT,
  PILLAR_VALUES,
  isCadence,
} from "./steps";

export type { ActionState };
export { fieldErrorsFrom };

const thisYear = new Date().getFullYear();

/** Empty strings from optional inputs become undefined before coercion. */
const blankToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess(blankToUndefined, z.coerce.number({ error: message }).int(message).min(min, message).max(max, message).optional());

const optionalDecimal = (min: number, max: number, message: string) =>
  z.preprocess(blankToUndefined, z.coerce.number({ error: message }).min(min, message).max(max, message).optional());

export const welcomeSchema = z
  .object({
    firstName: z.string().trim().min(1, "Tell us your first name.").max(60, "Keep it under 60 characters."),
    targetYear: z.coerce
      .number({ error: "Choose a year." })
      .int("Choose a whole year.")
      .min(thisYear, "Choose this year or later.")
      .max(thisYear + 40, "Choose a year within the next forty years."),
    birthYear: optionalInt(1900, thisYear - 10, "Enter a four digit birth year."),
  })
  .refine((v) => v.birthYear === undefined || v.targetYear > v.birthYear, {
    path: ["birthYear"],
    message: "Your birth year needs to come before your target year.",
  });

export type WelcomeInput = z.infer<typeof welcomeSchema>;

const longText = (required: boolean) => {
  const base = z.string().trim().max(4000, "Keep it under 4000 characters.");
  return required ? base.min(1, "Write a sentence or two, or use the example as a starting point.") : base;
};

export const northStarSchema = z.object({ body: longText(true) });

export const lifestyleSchema = z.object({
  lifestyle: longText(false),
  moment: longText(false),
});

const overrideText = z.string().trim().max(500, "Keep it under 500 characters.");

export const patternsSchema = z.object({
  focusIds: z
    .array(z.number().int().positive())
    .min(MIN_FOCUS, `Choose at least ${MIN_FOCUS} patterns.`)
    .max(MAX_FOCUS, `Choose no more than ${MAX_FOCUS} patterns.`)
    .refine((ids) => new Set(ids).size === ids.length, "Each pattern can only be chosen once."),
  overrides: z
    .record(z.string(), z.object({ replacement: overrideText.optional(), ifThen: overrideText.optional() }))
    .default({}),
});

export type PatternsInput = z.infer<typeof patternsSchema>;

export const personSchema = z.object({
  id: z.number().int().positive().nullable().default(null),
  group: z.enum(GROUP_KEYS),
  name: z.string().trim().min(1, "Add a name.").max(80, "Keep names under 80 characters."),
  cadenceDays: z.coerce.number().int().refine(isCadence, "Choose a cadence from the list."),
});

export const peopleSchema = z
  .object({
    people: z.array(personSchema).max(60, "Keep it under 60 people."),
  })
  .refine((v) => v.people.filter((p) => p.group === "partner").length <= 1, {
    path: ["people"],
    message: "Partner holds one name.",
  });

export type PeopleInput = z.infer<typeof peopleSchema>;

export const nonNegotiablesSchema = z
  .object({
    catalogueIds: z.array(z.number().int().positive()).max(NON_NEGOTIABLE_COUNT, `Choose exactly ${NON_NEGOTIABLE_COUNT}.`),
    custom: z
      .object({
        label: z
          .string()
          .trim()
          .min(1, "Give your custom non-negotiable a name.")
          .max(60, "Keep it under 60 characters."),
        pillar: z.enum(PILLAR_VALUES, { error: "Choose a pillar." }),
      })
      .nullable()
      .default(null),
  })
  .refine((v) => new Set(v.catalogueIds).size === v.catalogueIds.length, {
    path: ["catalogueIds"],
    message: "Each non-negotiable can only be chosen once.",
  })
  .refine((v) => v.catalogueIds.length + (v.custom ? 1 : 0) === NON_NEGOTIABLE_COUNT, {
    path: ["catalogueIds"],
    message: `Choose exactly ${NON_NEGOTIABLE_COUNT}.`,
  });

export type NonNegotiablesInput = z.infer<typeof nonNegotiablesSchema>;

export const identitySchema = z
  .object({
    statement: z
      .string()
      .trim()
      .min(1, "Write one sentence, or tap an example.")
      .max(240, "Keep it to one sentence, under 240 characters."),
    healthMode: z.enum(["track", "coached"], { error: "Choose how you want to handle health." }),
    startingWeight: optionalDecimal(20, 400, "Enter a weight in kilograms."),
    targetWeight: optionalDecimal(20, 400, "Enter a weight in kilograms."),
    targetBodyFatLow: optionalDecimal(2, 70, "Enter a body fat percentage."),
    targetBodyFatHigh: optionalDecimal(2, 70, "Enter a body fat percentage."),
  })
  .refine(
    (v) =>
      v.targetBodyFatLow === undefined ||
      v.targetBodyFatHigh === undefined ||
      v.targetBodyFatLow <= v.targetBodyFatHigh,
    { path: ["targetBodyFatHigh"], message: "The high end needs to be at least the low end." },
  );

export type IdentityInput = z.infer<typeof identitySchema>;

/** Parses a JSON hidden field. Returns null when it is missing or malformed. */
export function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value === "") return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
