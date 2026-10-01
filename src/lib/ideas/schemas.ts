import { z } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export const REVIEW_DAYS = 30;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional();

export const parkIdeaSchema = z.object({
  title: z.string().trim().min(1, "Write one line.").max(160, "Keep it under 160 characters."),
  note: optionalText(2000),
});

export const updateIdeaSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1, "Write one line.").max(160, "Keep it under 160 characters."),
  note: optionalText(2000),
});

/** The six filter questions. Every answer is optional. */
export const filterAnswersSchema = z.object({
  supportsVision: z.boolean().nullable().optional(),
  servesAudience: z.boolean().nullable().optional(),
  pillar: z.enum(["health", "purpose", "relationships", "identity"]).nullable().optional(),
  replaces: optionalText(500),
  genuineValue: optionalText(500),
  evidenceNow: z.boolean().nullable().optional(),
});

export type FilterAnswers = z.input<typeof filterAnswersSchema>;

export const decideIdeaSchema = z.object({
  id: z.number().int().positive(),
  decision: z.enum(["pursue", "review_30", "park", "kill"]),
  answers: filterAnswersSchema.optional(),
});

export type IdeaDecision = z.infer<typeof decideIdeaSchema>["decision"];
