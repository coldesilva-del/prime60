import type { Pillar } from "./score";

export interface DailyScoreRow {
  entryDate: string; // YYYY-MM-DD
  score: number;
  health: number; // points out of 30
  identity: number; // out of 30
  relationships: number; // out of 20
  purpose: number; // out of 20
}

export type Direction = "rising" | "steady" | "easing";

export interface Trajectory {
  /** null while fewer than 3 logged days in the window */
  value: number | null;
  direction: Direction | null;
  loggedDays: number;
  windowDays: number;
  unloggedDays: number;
  pillars: Record<Pillar, number | null>;
  /** Mean of the last 14 logged days minus the 14 before, null if too few. */
  delta: number | null;
}

const WEIGHTS: Record<Pillar, number> = { health: 30, identity: 30, relationships: 20, purpose: 20 };

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Day difference (b - a) in whole days for YYYY-MM-DD strings. */
function daysBetween(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400000);
}

/**
 * 28-day rolling trajectory ending on `today` (inclusive).
 * Rows outside the window are ignored. Days without a row are excluded from
 * the average, not counted as zero.
 */
export function computeTrajectory(rows: DailyScoreRow[], today: string, windowDays = 28): Trajectory {
  const inWindow = rows
    .filter((r) => {
      const d = daysBetween(r.entryDate, today);
      return d >= 0 && d < windowDays;
    })
    .sort((a, b) => (a.entryDate < b.entryDate ? -1 : 1));

  const loggedDays = inWindow.length;
  const minDays = 3;

  const pillars: Record<Pillar, number | null> = { health: null, identity: null, relationships: null, purpose: null };
  let value: number | null = null;
  let direction: Direction | null = null;
  let delta: number | null = null;

  if (loggedDays >= minDays) {
    value = Math.round(mean(inWindow.map((r) => r.score))!);
    for (const p of Object.keys(WEIGHTS) as Pillar[]) {
      const m = mean(inWindow.map((r) => (r[p] / WEIGHTS[p]) * 100));
      pillars[p] = m == null ? null : Math.round(m);
    }

    const half = Math.floor(windowDays / 2);
    const recent = inWindow.filter((r) => daysBetween(r.entryDate, today) < half);
    const prior = inWindow.filter((r) => daysBetween(r.entryDate, today) >= half);
    if (recent.length >= minDays && prior.length >= minDays) {
      delta = Math.round(mean(recent.map((r) => r.score))! - mean(prior.map((r) => r.score))!);
      direction = delta >= 3 ? "rising" : delta <= -3 ? "easing" : "steady";
    }
  }

  return {
    value,
    direction,
    loggedDays,
    windowDays,
    unloggedDays: windowDays - loggedDays,
    pillars,
    delta,
  };
}
