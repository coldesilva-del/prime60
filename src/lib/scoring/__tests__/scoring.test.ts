import { describe, expect, it } from "vitest";
import { computeScore, energyPoints, patternPoints, scoreBand, type EveningInputs } from "../score";
import { computeTrajectory, type DailyScoreRow } from "../trajectory";
import { computeReturnRate } from "../return-rate";
import { computeFinishRatio } from "../finish-ratio";

const perfect: EveningInputs = {
  healthMode: "coached",
  trained: true,
  moved: null,
  loggedWithCoach: true,
  energy: 10,
  finishedOneThing: true,
  courageRepToday: true,
  patternsFollowed: 0,
  patternsReplaced: 0,
  connected: true,
  qualityTime: true,
  published: true,
  movedProject: true,
  served: true,
};

describe("computeScore", () => {
  it("sums to 100 on a perfect day", () => {
    const r = computeScore(perfect);
    expect(r.score).toBe(100);
    expect(r.pillars).toEqual({ health: 30, identity: 30, relationships: 20, purpose: 20 });
    expect(r.pillarPercent).toEqual({ health: 100, identity: 100, relationships: 100, purpose: 100 });
  });

  it("is 10 (patterns handled) when nothing else is recorded", () => {
    const r = computeScore({
      ...perfect,
      trained: null,
      loggedWithCoach: null,
      energy: null,
      finishedOneThing: null,
      courageRepToday: false,
      connected: null,
      qualityTime: null,
      published: null,
      movedProject: null,
      served: null,
    });
    expect(r.score).toBe(10);
    expect(r.breakdown.find((b) => b.key === "i3")?.reason).toBe("No old pattern appeared");
  });

  it("uses moved in track mode and loggedWithCoach in coached mode", () => {
    const track = computeScore({ ...perfect, healthMode: "track", moved: false, loggedWithCoach: true });
    expect(track.pillars.health).toBe(23);
    const coached = computeScore({ ...perfect, healthMode: "coached", moved: true, loggedWithCoach: false });
    expect(coached.pillars.health).toBe(23);
  });

  it("rewards replacing patterns, not their absence", () => {
    expect(patternPoints(0, 3)).toEqual([10, "3 appearances, every one met with the replacement"]);
    expect(patternPoints(2, 0)[0]).toBe(0);
    expect(patternPoints(1, 1)[0]).toBe(5);
  });

  it("scales energy to 0..8", () => {
    expect(energyPoints(null)).toBe(0);
    expect(energyPoints(1)).toBe(1);
    expect(energyPoints(5)).toBe(4);
    expect(energyPoints(10)).toBe(8);
    expect(energyPoints(14)).toBe(8);
  });

  it("explains every point in the breakdown", () => {
    const r = computeScore(perfect);
    const total = r.breakdown.reduce((a, b) => a + b.points, 0);
    expect(total).toBe(r.score);
    expect(r.breakdown.every((b) => b.reason.length > 0)).toBe(true);
  });

  it("bands scores for the reveal line", () => {
    expect(scoreBand(100)).toBe("90");
    expect(scoreBand(85)).toBe("90");
    expect(scoreBand(84)).toBe("70");
    expect(scoreBand(70)).toBe("70");
    expect(scoreBand(69)).toBe("50");
    expect(scoreBand(49)).toBe("0");
  });
});

function row(date: string, score: number): DailyScoreRow {
  return { entryDate: date, score, health: score * 0.3, identity: score * 0.3, relationships: score * 0.2, purpose: score * 0.2 };
}

function dateOffset(base: string, offset: number): string {
  const d = new Date(Date.UTC(+base.slice(0, 4), +base.slice(5, 7) - 1, +base.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

describe("computeTrajectory", () => {
  const today = "2026-10-28";

  it("shows building with fewer than 3 logged days", () => {
    const t = computeTrajectory([row(today, 80), row(dateOffset(today, -1), 70)], today);
    expect(t.value).toBeNull();
    expect(t.loggedDays).toBe(2);
    expect(t.unloggedDays).toBe(26);
  });

  it("averages logged days only and ignores rows outside the window", () => {
    const rows = [row(today, 80), row(dateOffset(today, -1), 60), row(dateOffset(today, -2), 70), row(dateOffset(today, -40), 0)];
    const t = computeTrajectory(rows, today);
    expect(t.value).toBe(70);
    expect(t.loggedDays).toBe(3);
    expect(t.direction).toBeNull();
    expect(t.pillars.health).toBe(70);
  });

  it("reports rising when the recent 14 days beat the prior 14 by 3 or more", () => {
    const rows: DailyScoreRow[] = [];
    for (let i = 0; i < 28; i++) rows.push(row(dateOffset(today, -i), i < 14 ? 80 : 70));
    const t = computeTrajectory(rows, today);
    expect(t.value).toBe(75);
    expect(t.delta).toBe(10);
    expect(t.direction).toBe("rising");
  });

  it("reports steady within 3 points and easing below", () => {
    const steady: DailyScoreRow[] = [];
    for (let i = 0; i < 28; i++) steady.push(row(dateOffset(today, -i), i < 14 ? 72 : 70));
    expect(computeTrajectory(steady, today).direction).toBe("steady");
    const easing: DailyScoreRow[] = [];
    for (let i = 0; i < 28; i++) easing.push(row(dateOffset(today, -i), i < 14 ? 60 : 70));
    expect(computeTrajectory(easing, today).direction).toBe("easing");
  });
});

describe("computeReturnRate", () => {
  it("hides the value below 3 misses", () => {
    const r = computeReturnRate([
      { entryDate: "2026-10-01", nonNegotiableId: 1, completed: false },
      { entryDate: "2026-10-02", nonNegotiableId: 1, completed: true },
    ]);
    expect(r.misses).toBe(1);
    expect(r.recoveries).toBe(1);
    expect(r.value).toBeNull();
  });

  it("counts a miss only when the next day is logged", () => {
    const r = computeReturnRate([
      { entryDate: "2026-10-01", nonNegotiableId: 1, completed: false },
      { entryDate: "2026-10-02", nonNegotiableId: 1, completed: true },
      { entryDate: "2026-10-03", nonNegotiableId: 1, completed: false },
      { entryDate: "2026-10-04", nonNegotiableId: 1, completed: false },
      { entryDate: "2026-10-05", nonNegotiableId: 1, completed: true },
      { entryDate: "2026-10-06", nonNegotiableId: 1, completed: false }, // no next day yet
    ]);
    expect(r.misses).toBe(3);
    expect(r.recoveries).toBe(2);
    expect(r.value).toBe(67);
  });

  it("keeps non-negotiables separate", () => {
    const r = computeReturnRate(
      [
        { entryDate: "2026-10-01", nonNegotiableId: 1, completed: false },
        { entryDate: "2026-10-02", nonNegotiableId: 2, completed: true },
      ],
      1,
    );
    expect(r.misses).toBe(0);
  });
});

describe("computeFinishRatio", () => {
  const start = "2026-07-01T00:00:00Z";
  const end = "2026-10-01T00:00:00Z";

  it("hides the ratio under 3 starts but still reports counts", () => {
    const r = computeFinishRatio(
      [
        { projectId: 1, toStatus: "active", changedAt: "2026-08-01T00:00:00Z" },
        { projectId: 1, toStatus: "finished", changedAt: "2026-09-01T00:00:00Z" },
      ],
      start,
      end,
    );
    expect(r).toEqual({ started: 1, finished: 1, ratio: null });
  });

  it("computes the ratio with 3 or more starts and ignores changes outside the window", () => {
    const r = computeFinishRatio(
      [
        { projectId: 1, toStatus: "active", changedAt: "2026-07-05T00:00:00Z" },
        { projectId: 2, toStatus: "active", changedAt: "2026-07-06T00:00:00Z" },
        { projectId: 3, toStatus: "active", changedAt: "2026-07-07T00:00:00Z" },
        { projectId: 1, toStatus: "finished", changedAt: "2026-08-01T00:00:00Z" },
        { projectId: 2, toStatus: "finished", changedAt: "2026-09-01T00:00:00Z" },
        { projectId: 9, toStatus: "active", changedAt: "2026-01-01T00:00:00Z" },
        { projectId: 9, toStatus: "finished", changedAt: "2026-02-01T00:00:00Z" },
      ],
      start,
      end,
    );
    expect(r).toEqual({ started: 3, finished: 2, ratio: 0.67 });
  });

  it("counts a project reactivated twice as one start", () => {
    const r = computeFinishRatio(
      [
        { projectId: 1, toStatus: "active", changedAt: "2026-07-05T00:00:00Z" },
        { projectId: 1, toStatus: "paused", changedAt: "2026-07-10T00:00:00Z" },
        { projectId: 1, toStatus: "active", changedAt: "2026-07-20T00:00:00Z" },
      ],
      start,
      end,
      1,
    );
    expect(r.started).toBe(1);
  });
});
