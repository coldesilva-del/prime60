import { z } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export const MAX_IN_FOCUS = 5;

const optionalText = z
  .string()
  .trim()
  .max(1000, "Keep it under 1000 characters.")
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional();

export const logPatternSchema = z.object({
  patternId: z.number().int().positive(),
  response: z.enum(["followed", "replaced"]),
});

export const occurrenceDetailSchema = z.object({
  occurrenceId: z.number().int().positive(),
  cue: optionalText,
  desire: optionalText,
  old_response: optionalText,
  immediate_reward: optionalText,
  long_term_cost: optionalText,
  prime_response: optionalText,
  action_taken: optionalText,
  lesson: optionalText,
});

export type OccurrenceDetailInput = z.input<typeof occurrenceDetailSchema>;

export const setInFocusSchema = z.object({
  patternId: z.number().int().positive(),
  inFocus: z.boolean(),
});

export const overridesSchema = z.object({
  patternId: z.number().int().positive(),
  replacementOverride: optionalText,
  ifThenOverride: optionalText,
});

/** A library pattern merged with the user's row, if any. */
export type PatternView = {
  patternId: number;
  userPatternId: number | null;
  slug: string;
  name: string;
  description: string;
  /** Effective replacement: override when set, else library text. */
  replacement: string;
  /** Effective IF-THEN: override when set, else library text. */
  ifThen: string;
  twoMinuteStart: string | null;
  replacementOverride: string | null;
  ifThenOverride: string | null;
  inFocus: boolean;
  sortOrder: number;
};
