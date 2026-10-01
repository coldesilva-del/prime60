import { describe, expect, it } from "vitest";
import { bandPosition, progressToTarget, sessionsThisWeek, toGoWords, trainingConsistency } from "../progress";

describe("progressToTarget", () => {
  it("rises as weight rises when the target is above the start (Colin)", () => {
    const p = progressToTarget(69.5, 73.25, 77);
    expect(p.direction).toBe("up");
    expect(p.percent).toBe(50);
    expect(p.remaining).toBe(3.8);
    expect(p.total).toBe(7.5);
    expect(toGoWords(p, "kg")).toBe("3.8 of 7.5 kg to go");
  });
  it("rises as weight falls when the target is below the start", () => {
    const p = progressToTarget(95, 90, 85);
    expect(p.direction).toBe("down");
    expect(p.percent).toBe(50);
    expect(p.remaining).toBe(5);
    expect(toGoWords(p, "kg")).toBe("5 of 10 kg to go");
  });
  it("clamps to 0 and 100", () => {
    expect(progressToTarget(69.5, 68, 77).percent).toBe(0);
    expect(progressToTarget(69.5, 80, 77).percent).toBe(100);
    expect(progressToTarget(69.5, 80, 77).remaining).toBe(0);
    expect(toGoWords(progressToTarget(69.5, 77, 77), "kg")).toBe("At target");
  });
  it("is null without a start, current or target", () => {
    expect(progressToTarget(null, 70, 77).percent).toBeNull();
    expect(progressToTarget(69.5, null, 77).percent).toBeNull();
    expect(progressToTarget(69.5, 70, null).percent).toBeNull();
    expect(progressToTarget(70, 70, 70).percent).toBeNull();
    expect(toGoWords(progressToTarget(null, 70, 77), "kg")).toBeNull();
  });
});

describe("bandPosition", () => {
  it("names below, within and above", () => {
    expect(bandPosition(14, 10, 12).state).toBe("above");
    expect(bandPosition(14, 10, 12).words).toBe("2 above the band");
    expect(bandPosition(11, 10, 12).words).toBe("Within the target band");
    expect(bandPosition(9.5, 12, 10).words).toBe("0.5 below the band");
    expect(bandPosition(null, 10, 12).state).toBeNull();
  });
});

describe("training", () => {
  it("consistency is trained days over logged days", () => {
    const c = trainingConsistency([{ trained: true }, { trained: false }, { trained: true }, { trained: null }]);
    expect(c).toEqual({ trained: 2, logged: 4, percent: 50 });
    expect(trainingConsistency([]).percent).toBeNull();
  });
  it("sessions this week compare trained days with the combined programme", () => {
    expect(sessionsThisWeek(3, 3, 2).words).toBe("3 of 5 sessions this week");
    expect(sessionsThisWeek(1, null, null).words).toBe("1 session this week");
  });
});
