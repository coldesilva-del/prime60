import { z } from "zod";

const optionalId = z.number().int().positive().nullable();
const tri = z.boolean().nullable();

export const morningSchema = z.object({
  oneThing: z.string().trim().min(1, "Write the one thing to finish today.").max(200, "Keep it under 200 characters."),
  oneThingProjectId: optionalId,
  courageIntentTypeId: optionalId,
  personId: optionalId,
});
export type MorningInput = z.infer<typeof morningSchema>;

export const toggleCommitmentSchema = z.object({
  nonNegotiableId: z.number().int().positive(),
  completed: z.boolean(),
});

export const finishedSchema = z.object({ finished: z.boolean() });

export const eveningSchema = z.object({
  trained: tri,
  moved: tri,
  loggedWithCoach: tri,
  energy: z.number().int().min(1).max(10).nullable(),
  finishedOneThing: tri,
  courageRepToday: z.boolean(),
  connected: tri,
  qualityTime: tri,
  published: tri,
  movedProject: tri,
  served: tri,
});
export type EveningInput = z.infer<typeof eveningSchema>;

export const closingLineSchema = z.object({
  closingLine: z.string().trim().max(240, "Keep it under 240 characters."),
});
