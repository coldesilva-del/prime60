import { z } from "zod";
import type { Pillar, ProjectStatus } from "@/lib/supabase/types";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export const PILLARS: { value: Pillar; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "purpose", label: "Purpose" },
  { value: "relationships", label: "Relationships" },
  { value: "identity", label: "Identity" },
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  active: "Active",
  blocked: "Blocked",
  paused: "Paused",
  finished: "Finished",
  killed: "Killed",
};

export const projectStatusSchema = z.enum(["idea", "active", "blocked", "paused", "finished", "killed"]);
export const pillarSchema = z.enum(["health", "purpose", "relationships", "identity"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional();

const optionalDay = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Use a real date." });

export const projectFieldsSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name.").max(120, "Keep the name under 120 characters."),
  pillar: pillarSchema,
  definition_of_done: optionalText(1000),
  target_on: optionalDay,
  next_action: optionalText(300),
  notes: optionalText(4000),
});

export type ProjectFieldsInput = z.input<typeof projectFieldsSchema>;

export const createProjectSchema = projectFieldsSchema.extend({
  /** Start as active (may trigger the limit dialog) or save as an idea. */
  startActive: z.boolean().default(false),
});

export const updateProjectSchema = projectFieldsSchema.extend({
  id: z.number().int().positive(),
});

export const limitChoiceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("finish"), projectId: z.number().int().positive() }),
  z.object({ kind: z.literal("pause"), projectId: z.number().int().positive() }),
  z.object({ kind: z.literal("kill"), projectId: z.number().int().positive() }),
  z.object({ kind: z.literal("park") }),
  z.object({ kind: z.literal("override") }),
]);

export const changeStatusSchema = z.object({
  id: z.number().int().positive(),
  toStatus: projectStatusSchema,
  note: optionalText(300),
  choice: limitChoiceSchema.optional(),
});

/** What the active-limit dialog needs to render. */
export type LimitPrompt = {
  activeCount: number;
  limit: number;
  active: { id: number; name: string }[];
};

export type StatusChangeResult =
  | { ok: true; projectId: number; status: ProjectStatus }
  | { error: string }
  | { limit: LimitPrompt; projectId: number };
