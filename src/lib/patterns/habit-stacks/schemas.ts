import { z } from "zod";

export const MAX_ACTIVE_STACKS = 8;

const line = (label: string) =>
  z.string().trim().min(1, `Write the ${label}.`).max(160, "Keep it under 160 characters.");

export const habitStackSchema = z.object({
  anchor: line("anchor"),
  behaviour: line("behaviour"),
});

export const habitStackUpdateSchema = habitStackSchema.extend({
  id: z.number().int().positive(),
});

export const habitStackIdSchema = z.object({ id: z.number().int().positive() });

export const habitStackMoveSchema = z.object({
  id: z.number().int().positive(),
  direction: z.enum(["up", "down"]),
});
