import { z } from "zod";

export const REVIEW_SECTIONS = ["a", "b", "c", "d", "e", "f"] as const;
export type ReviewSection = (typeof REVIEW_SECTIONS)[number];

export const SECTION_TITLES: Record<ReviewSection, string> = {
  a: "Health",
  b: "Purpose",
  c: "Relationships",
  d: "Identity",
  e: "Atomic habits",
  f: "Next week",
};

export const MAX_PATTERNS_IN_FOCUS = 5;

export const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-05.");

const answerText = z.string().trim().max(4000, "Keep each answer under 4000 characters.");

export const saveSectionSchema = z.object({
  weekStart: dayString,
  section: z.enum(REVIEW_SECTIONS),
  answers: z.record(z.string().max(80), answerText).default({}),
  nextPriority: z.string().trim().max(200, "Keep the priority to one line.").optional(),
  nextOneThing: z.string().trim().max(200, "Keep the one thing to one line.").optional(),
  complete: z.boolean().optional(),
});
export type SaveSectionInput = z.input<typeof saveSectionSchema>;

export const setPatternFocusSchema = z.object({
  patternId: z.number().int().positive(),
  inFocus: z.boolean(),
});
export type SetPatternFocusInput = z.input<typeof setPatternFocusSchema>;

export const recomputeSnapshotSchema = z.object({ weekStart: dayString });

export type ReviewAnswers = Record<string, string>;

/** Narrow a jsonb answers value to a string map. */
export function answersFrom(value: unknown): ReviewAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: ReviewAnswers = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
