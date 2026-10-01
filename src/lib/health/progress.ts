/**
 * Pure health maths. Direction-aware: a man going from 69.5 kg up to 77 kg
 * and a man going from 95 kg down to 85 kg both see progress rise toward 100.
 */

export interface TargetProgress {
  /** 0 to 100, clamped. Null when start, current or target is missing or start equals target. */
  percent: number | null;
  /** Distance still to travel, in the unit, never negative. */
  remaining: number | null;
  /** Total distance from start to target. */
  total: number | null;
  direction: "up" | "down" | null;
}

export function progressToTarget(
  start: number | null,
  current: number | null,
  target: number | null,
): TargetProgress {
  if (start == null || current == null || target == null || start === target) {
    return { percent: null, remaining: null, total: null, direction: null };
  }
  const total = target - start;
  const travelled = current - start;
  const raw = (travelled / total) * 100;
  const percent = Math.round(Math.min(100, Math.max(0, raw)));
  const direction = total > 0 ? "up" : "down";
  const remaining = Math.max(0, direction === "up" ? target - current : current - target);
  return {
    percent,
    remaining: Math.round(remaining * 10) / 10,
    total: Math.round(Math.abs(total) * 10) / 10,
    direction,
  };
}

/** "2.5 of 7.5 kg to go", or "At target", or null when unknown. */
export function toGoWords(p: TargetProgress, unit: string): string | null {
  if (p.remaining == null || p.total == null) return null;
  if (p.remaining === 0) return "At target";
  return `${formatNumber(p.remaining)} of ${formatNumber(p.total)} ${unit} to go`;
}

export function formatNumber(n: number, decimals = 1): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

export interface BandPosition {
  state: "below" | "within" | "above" | null;
  words: string | null;
}

/** Where a body fat reading sits against the target band. */
export function bandPosition(current: number | null, low: number | null, high: number | null): BandPosition {
  if (current == null || low == null || high == null) return { state: null, words: null };
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  if (current < lo) return { state: "below", words: `${formatNumber(lo - current)} below the band` };
  if (current > hi) return { state: "above", words: `${formatNumber(current - hi)} above the band` };
  return { state: "within", words: "Within the target band" };
}

export interface Consistency {
  trained: number;
  logged: number;
  /** 0 to 100, null when nothing is logged */
  percent: number | null;
}

/** Training consistency: days trained divided by days with an evening check-in. */
export function trainingConsistency(days: { trained: boolean | null }[]): Consistency {
  const logged = days.length;
  const trained = days.filter((d) => d.trained === true).length;
  return { trained, logged, percent: logged === 0 ? null : Math.round((trained / logged) * 100) };
}

export interface WeekSessions {
  trained: number;
  resistanceTarget: number | null;
  cardioTarget: number | null;
  words: string;
}

/**
 * V1 counts each trained day as one session, so one number is compared with
 * the resistance target and the cardio target together.
 */
export function sessionsThisWeek(
  trainedDays: number,
  resistanceTarget: number | null,
  cardioTarget: number | null,
): WeekSessions {
  const target = (resistanceTarget ?? 0) + (cardioTarget ?? 0);
  const words =
    target > 0
      ? `${trainedDays} of ${target} sessions this week`
      : `${trainedDays} session${trainedDays === 1 ? "" : "s"} this week`;
  return { trained: trainedDays, resistanceTarget, cardioTarget, words };
}

export const HEALTH_FIELDS = [
  "weight",
  "body_fat",
  "waist",
  "sleep_hours",
  "sleep_quality",
  "training_performance",
  "steps",
  "calories",
  "protein",
  "cardio_calories",
  "notes",
] as const;

export type HealthField = (typeof HEALTH_FIELDS)[number];

export const HEALTH_FIELD_LABEL: Record<HealthField, string> = {
  weight: "Weight (kg)",
  body_fat: "Body fat (%)",
  waist: "Waist (cm)",
  sleep_hours: "Sleep (hours)",
  sleep_quality: "Sleep quality",
  training_performance: "Training performance",
  steps: "Steps",
  calories: "Calories",
  protein: "Protein (g)",
  cardio_calories: "Cardio calories",
  notes: "Notes",
};

export function isHidden(field: HealthField, hidden: string[]): boolean {
  return hidden.includes(field);
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
