/**
 * Return Rate: of the days a non-negotiable was missed, how many were
 * followed by completion the very next day. "Never miss twice" as a number.
 */

export interface CommitmentDay {
  entryDate: string; // YYYY-MM-DD
  nonNegotiableId: number;
  completed: boolean;
}

export interface ReturnRate {
  /** 0 to 100, or null when fewer than minMisses misses in the window */
  value: number | null;
  misses: number;
  recoveries: number;
}

function nextDay(date: string): string {
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * `rows` should contain one row per (date, non-negotiable) for every day the
 * commitment existed, including days it was missed. A missing row for a day is
 * treated as a miss only if the following day's row exists (so the commitment
 * was still active).
 */
export function computeReturnRate(rows: CommitmentDay[], minMisses = 3): ReturnRate {
  const byKey = new Map<string, boolean>();
  for (const r of rows) byKey.set(`${r.nonNegotiableId}|${r.entryDate}`, r.completed);

  let misses = 0;
  let recoveries = 0;

  for (const r of rows) {
    if (r.completed) continue;
    const next = byKey.get(`${r.nonNegotiableId}|${nextDay(r.entryDate)}`);
    if (next === undefined) continue; // the next day is not yet logged; no verdict
    misses += 1;
    if (next) recoveries += 1;
  }

  return {
    value: misses >= minMisses ? Math.round((recoveries / misses) * 100) : null,
    misses,
    recoveries,
  };
}
