import { z } from "zod";

export const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-05.");

export const PILLARS = ["health", "purpose", "relationships", "identity"] as const;
export const OBJECTIVE_STATUSES = ["on_track", "at_risk", "done", "stopped"] as const;
export const END_DECISIONS = ["continue", "adapt", "stop", "scale"] as const;
export const ROADMAP_HORIZONS = ["1y", "3y", "5y"] as const;

export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];
export type EndDecision = (typeof END_DECISIONS)[number];
export type RoadmapHorizon = (typeof ROADMAP_HORIZONS)[number];

export const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  on_track: "On track",
  at_risk: "At risk",
  done: "Done",
  stopped: "Stopped",
};

export const DECISION_LABELS: Record<EndDecision, string> = {
  continue: "Continue",
  adapt: "Adapt",
  stop: "Stop",
  scale: "Scale",
};

export const HORIZON_LABELS: Record<RoadmapHorizon, string> = {
  "1y": "12 months",
  "3y": "3 years",
  "5y": "5 years",
};

const line = (max: number, msg: string) => z.string().trim().max(max, msg);
const optionalLine = (max = 500) =>
  line(max, `Keep it under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : null));

export const startCycleSchema = z.object({
  startsOn: dayString,
  fromCycleId: z.coerce.number().int().positive().optional(),
});

export const objectiveSchema = z.object({
  pillar: z.enum(PILLARS, { error: "Choose a pillar." }),
  outcome: z.string().trim().min(1, "Write the outcome in one line.").max(300, "Keep the outcome under 300 characters."),
  why: optionalLine(),
  startingPoint: optionalLine(),
  metric: optionalLine(200),
  target: optionalLine(200),
  leadingIndicator: optionalLine(300),
  nextAction: optionalLine(300),
  status: z.enum(OBJECTIVE_STATUSES).default("on_track"),
});
export type ObjectiveInput = z.input<typeof objectiveSchema>;

export const closeCycleSchema = z.object({
  decisions: z.array(z.object({ id: z.number().int().positive(), endDecision: z.enum(END_DECISIONS) })),
  closingNotes: z.string().trim().max(4000, "Keep the notes under 4000 characters.").optional(),
});

export const roadmapBody = z.string().trim().min(1, "Write one line.").max(300, "Keep it under 300 characters.");

export const addRoadmapItemSchema = z.object({
  horizon: z.enum(ROADMAP_HORIZONS),
  body: roadmapBody,
});

export const updateRoadmapItemSchema = z.object({
  id: z.number().int().positive(),
  body: roadmapBody,
});

export const removeRoadmapItemSchema = z.object({ id: z.number().int().positive() });

export const moveRoadmapItemSchema = z.object({
  id: z.number().int().positive(),
  direction: z.enum(["up", "down"]),
});
