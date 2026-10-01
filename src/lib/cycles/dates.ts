/**
 * 90-day cycle arithmetic. Pure, no I/O. Days are YYYY-MM-DD strings in the
 * user's timezone (see @/lib/dates).
 */

import { addDays, daysBetween } from "@/lib/dates";
import type { Pillar } from "@/lib/supabase/types";

export const CYCLE_LENGTH_DAYS = 90;
export const MAX_OBJECTIVES = 6;

export const PILLAR_ORDER: Pillar[] = ["health", "purpose", "relationships", "identity"];

export const PILLAR_LABELS: Record<Pillar, string> = {
  health: "Health",
  purpose: "Purpose",
  relationships: "Relationships",
  identity: "Identity",
};

/** Guideline counts per pillar, shown as helper text. Only the total of six is enforced. */
export const PILLAR_GUIDELINES: Record<Pillar, { min: number; max: number; text: string }> = {
  health: { min: 1, max: 2, text: "One or two" },
  purpose: { min: 1, max: 2, text: "One or two" },
  relationships: { min: 1, max: 1, text: "One" },
  identity: { min: 1, max: 1, text: "One" },
};

/** A cycle that starts on `startsOn` ends 89 days later, 90 days inclusive. */
export function cycleEndsOn(startsOn: string): string {
  return addDays(startsOn, CYCLE_LENGTH_DAYS - 1);
}

/** Whole days in the cycle, inclusive of both ends. */
export function cycleLength(startsOn: string, endsOn: string): number {
  return Math.max(0, daysBetween(startsOn, endsOn) + 1);
}

/** Day number within the cycle (1 on the first day), clamped to the cycle. */
export function cycleDayNumber(startsOn: string, endsOn: string, today: string): number {
  const n = daysBetween(startsOn, today) + 1;
  return Math.min(Math.max(n, 0), cycleLength(startsOn, endsOn));
}

/** Days left including today. 0 once the cycle has ended. */
export function cycleDaysRemaining(endsOn: string, today: string): number {
  return Math.max(0, daysBetween(today, endsOn) + 1);
}

/** Share of the cycle elapsed, 0 to 1. */
export function cycleProgress(startsOn: string, endsOn: string, today: string): number {
  const total = cycleLength(startsOn, endsOn);
  if (total === 0) return 1;
  const elapsed = Math.min(Math.max(daysBetween(startsOn, today), 0), total);
  return elapsed / total;
}

export function cycleHasEnded(endsOn: string, today: string): boolean {
  return today > endsOn;
}

export interface CarryableObjective {
  pillar: Pillar;
  outcome: string;
  why: string | null;
  metric: string | null;
  target: string | null;
  end_decision: "continue" | "adapt" | "stop" | "scale" | null;
  sort_order: number;
}

export interface CarriedObjective {
  pillar: Pillar;
  outcome: string;
  why: string | null;
  metric: string | null;
  target: string | null;
  status: "on_track";
  sort_order: number;
}

/**
 * Objectives marked Continue or Scale carry into the next cycle with outcome,
 * why, metric and target copied and status reset. Starting point, leading
 * indicator and next action are left for the user to write afresh.
 */
export function carryForward(objectives: CarryableObjective[]): CarriedObjective[] {
  return [...objectives]
    .filter((o) => o.end_decision === "continue" || o.end_decision === "scale")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o, i) => ({
      pillar: o.pillar,
      outcome: o.outcome,
      why: o.why,
      metric: o.metric,
      target: o.target,
      status: "on_track",
      sort_order: i,
    }));
}

/** Count of objectives per pillar, for the guideline helper text. */
export function countByPillar(objectives: { pillar: Pillar }[]): Record<Pillar, number> {
  const out: Record<Pillar, number> = { health: 0, purpose: 0, relationships: 0, identity: 0 };
  for (const o of objectives) out[o.pillar] += 1;
  return out;
}
