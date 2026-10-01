/**
 * Pure helpers for the progress dashboard. No colour words, no verdicts:
 * "fewer", "more", "steady" and plain arithmetic the user can check.
 */

export type ChangeWord = "fewer" | "more" | "steady";

export function changeWord(then: number, now: number): ChangeWord {
  if (now < then) return "fewer";
  if (now > then) return "more";
  return "steady";
}

/** "12 then, 7 now, fewer" or "No earlier period to compare" when then is null. */
export function comparisonLine(then: number | null, now: number): string {
  if (then === null) return `${now} in this period`;
  return `${then} then, ${now} now, ${changeWord(then, now)}`;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const DIRECTION_WORD = {
  rising: "Rising",
  steady: "Steady",
  easing: "Easing",
} as const;

export const DIRECTION_GLYPH = {
  rising: "\u2197",
  steady: "\u2192",
  easing: "\u2198",
} as const;

export const PILLAR_LABEL = {
  health: "Health",
  identity: "Identity",
  relationships: "Relationships",
  purpose: "Purpose",
} as const;
