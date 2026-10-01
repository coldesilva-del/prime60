import { z } from "zod";
import type { StuckWhy } from "@/lib/supabase/types";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export const DEFAULT_TIMER_SECONDS = 900;
export const SHORT_TIMER_SECONDS = 120;

/** Order matches the wireframe. Labels come from content_snippets stuck_why_<key>. */
export const STUCK_WHY_KEYS: StuckWhy[] = [
  "fear",
  "uncertainty",
  "complexity",
  "boredom",
  "perfectionism",
  "rejection",
  "difficult_conversation",
  "dont_know_where_to_begin",
  "other",
];

export const STUCK_WHY_FALLBACKS: Record<StuckWhy, string> = {
  fear: "Fear",
  uncertainty: "Uncertainty",
  complexity: "Complexity",
  boredom: "Boredom",
  perfectionism: "Perfectionism",
  rejection: "Rejection",
  difficult_conversation: "A difficult conversation",
  dont_know_where_to_begin: "I don't know where to begin",
  other: "Something else",
};

const line = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters.`);

export const startStuckSchema = z.object({
  avoiding: line(300).min(1, "Name the thing you are avoiding."),
  why: z.enum(STUCK_WHY_KEYS),
  smallestAction: line(300).min(1, "Write the smallest meaningful action."),
  primeSelfWould: line(500)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
  timerSeconds: z.number().int().min(60).max(3600).default(DEFAULT_TIMER_SECONDS),
});

export type StartStuckInput = z.input<typeof startStuckSchema>;

export const completeStuckSchema = z.object({
  id: z.number().int().positive(),
  outcome: z.enum(["yes", "partly", "no"]),
  nextAction: line(300)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
});

export type CompleteStuckInput = z.input<typeof completeStuckSchema>;
