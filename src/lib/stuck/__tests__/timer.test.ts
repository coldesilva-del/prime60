import { describe, expect, it } from "vitest";
import {
  createTimer,
  elapsedMs,
  formatClock,
  isFinished,
  isTimerState,
  pauseTimer,
  remainingSeconds,
  resumeTimer,
} from "../timer";

const T0 = 1_700_000_000_000;

describe("remainingSeconds", () => {
  it("starts at the full length", () => {
    const t = createTimer(900, T0);
    expect(remainingSeconds(t, T0)).toBe(900);
  });

  it("counts down from the wall clock, not from ticks", () => {
    const t = createTimer(900, T0);
    expect(remainingSeconds(t, T0 + 60_000)).toBe(840);
    // A locked phone that wakes 10 minutes later sees 10 minutes gone.
    expect(remainingSeconds(t, T0 + 600_000)).toBe(300);
  });

  it("rounds up partial seconds so the display does not flash early", () => {
    const t = createTimer(900, T0);
    expect(remainingSeconds(t, T0 + 200)).toBe(900);
    expect(remainingSeconds(t, T0 + 1_000)).toBe(899);
  });

  it("never goes below zero", () => {
    const t = createTimer(120, T0);
    expect(remainingSeconds(t, T0 + 500_000)).toBe(0);
    expect(isFinished(t, T0 + 120_000)).toBe(true);
    expect(isFinished(t, T0 + 119_000)).toBe(false);
  });

  it("ignores a clock that runs backwards", () => {
    const t = createTimer(900, T0);
    expect(elapsedMs(t, T0 - 5_000)).toBe(0);
  });
});

describe("pause and resume", () => {
  it("freezes remaining time while paused", () => {
    let t = createTimer(900, T0);
    t = pauseTimer(t, T0 + 60_000);
    expect(remainingSeconds(t, T0 + 60_000)).toBe(840);
    expect(remainingSeconds(t, T0 + 400_000)).toBe(840);
  });

  it("accumulates pause time across resumes", () => {
    let t = createTimer(900, T0);
    t = pauseTimer(t, T0 + 60_000); // paused at 14:00
    t = resumeTimer(t, T0 + 120_000); // 60s paused
    expect(t.pausedAccumulatedMs).toBe(60_000);
    expect(t.pausedAtMs).toBeNull();
    expect(remainingSeconds(t, T0 + 120_000)).toBe(840);
    t = pauseTimer(t, T0 + 180_000); // 13:00
    t = resumeTimer(t, T0 + 300_000); // 120s more paused
    expect(t.pausedAccumulatedMs).toBe(180_000);
    expect(remainingSeconds(t, T0 + 300_000)).toBe(780);
  });

  it("is idempotent", () => {
    const t = createTimer(900, T0);
    const p = pauseTimer(t, T0 + 1_000);
    expect(pauseTimer(p, T0 + 2_000)).toBe(p);
    expect(resumeTimer(t, T0 + 2_000)).toBe(t);
  });
});

describe("formatClock", () => {
  it("formats mm:ss", () => {
    expect(formatClock(900)).toBe("15:00");
    expect(formatClock(120)).toBe("02:00");
    expect(formatClock(9)).toBe("00:09");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(-4)).toBe("00:00");
  });
});

describe("isTimerState", () => {
  it("accepts a stored state and rejects junk", () => {
    expect(isTimerState(createTimer(900, T0))).toBe(true);
    expect(isTimerState({ startedAtMs: "x" })).toBe(false);
    expect(isTimerState(null)).toBe(false);
  });
});
