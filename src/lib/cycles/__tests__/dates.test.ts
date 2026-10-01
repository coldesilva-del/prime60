import { describe, expect, it } from "vitest";
import {
  carryForward,
  countByPillar,
  cycleDayNumber,
  cycleDaysRemaining,
  cycleEndsOn,
  cycleHasEnded,
  cycleLength,
  cycleProgress,
} from "../dates";

describe("cycle dates", () => {
  it("ends 89 days after it starts, 90 days inclusive", () => {
    expect(cycleEndsOn("2026-10-01")).toBe("2026-12-29");
    expect(cycleLength("2026-10-01", "2026-12-29")).toBe(90);
    // across a year end
    expect(cycleEndsOn("2026-11-15")).toBe("2027-02-12");
  });

  it("counts the day number and days remaining inclusively", () => {
    const start = "2026-10-01";
    const end = cycleEndsOn(start);
    expect(cycleDayNumber(start, end, "2026-10-01")).toBe(1);
    expect(cycleDayNumber(start, end, "2026-12-29")).toBe(90);
    expect(cycleDayNumber(start, end, "2027-01-10")).toBe(90);
    expect(cycleDayNumber(start, end, "2026-09-20")).toBe(0);

    expect(cycleDaysRemaining(end, "2026-10-01")).toBe(90);
    expect(cycleDaysRemaining(end, "2026-12-29")).toBe(1);
    expect(cycleDaysRemaining(end, "2026-12-30")).toBe(0);
  });

  it("reports progress between 0 and 1", () => {
    const start = "2026-10-01";
    const end = cycleEndsOn(start);
    expect(cycleProgress(start, end, "2026-10-01")).toBe(0);
    expect(cycleProgress(start, end, "2026-11-15")).toBeCloseTo(45 / 90);
    expect(cycleProgress(start, end, "2027-03-01")).toBe(1);
    expect(cycleProgress(start, end, "2026-09-01")).toBe(0);
  });

  it("knows when a cycle has ended", () => {
    expect(cycleHasEnded("2026-12-29", "2026-12-29")).toBe(false);
    expect(cycleHasEnded("2026-12-29", "2026-12-30")).toBe(true);
  });
});

describe("carryForward", () => {
  it("carries Continue and Scale objectives with status reset, in order", () => {
    const carried = carryForward([
      { pillar: "purpose", outcome: "Ship Prime 60", why: "Freedom", metric: "Users", target: "100", end_decision: "scale", sort_order: 2 },
      { pillar: "health", outcome: "77 kg", why: null, metric: "Weight", target: "77", end_decision: "continue", sort_order: 0 },
      { pillar: "identity", outcome: "Publish daily", why: null, metric: null, target: null, end_decision: "stop", sort_order: 1 },
      { pillar: "relationships", outcome: "Weekly date", why: null, metric: null, target: null, end_decision: "adapt", sort_order: 3 },
      { pillar: "health", outcome: "Undecided", why: null, metric: null, target: null, end_decision: null, sort_order: 4 },
    ]);
    expect(carried).toEqual([
      { pillar: "health", outcome: "77 kg", why: null, metric: "Weight", target: "77", status: "on_track", sort_order: 0 },
      { pillar: "purpose", outcome: "Ship Prime 60", why: "Freedom", metric: "Users", target: "100", status: "on_track", sort_order: 1 },
    ]);
  });

  it("counts objectives per pillar", () => {
    expect(countByPillar([{ pillar: "health" }, { pillar: "health" }, { pillar: "identity" }])).toEqual({
      health: 2,
      purpose: 0,
      relationships: 0,
      identity: 1,
    });
  });
});
