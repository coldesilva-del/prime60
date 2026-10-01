/**
 * Finish Ratio: projects finished divided by projects started in a window.
 * Hidden (null) when there are fewer than `minStarts` starts, because a ratio
 * of 1 finish over 1 start says nothing.
 */

export interface StatusChange {
  projectId: number;
  toStatus: string;
  changedAt: string; // ISO timestamp
}

export interface FinishRatio {
  started: number;
  finished: number;
  /** null when started < minStarts */
  ratio: number | null;
}

export function computeFinishRatio(
  changes: StatusChange[],
  windowStart: string,
  windowEnd: string,
  minStarts = 3,
): FinishRatio {
  const startedIds = new Set<number>();
  const finishedIds = new Set<number>();

  for (const c of changes) {
    if (c.changedAt < windowStart || c.changedAt > windowEnd) continue;
    if (c.toStatus === "active") startedIds.add(c.projectId);
    if (c.toStatus === "finished") finishedIds.add(c.projectId);
  }

  const started = startedIds.size;
  const finished = finishedIds.size;
  return {
    started,
    finished,
    ratio: started >= minStarts ? Math.round((finished / started) * 100) / 100 : null,
  };
}
