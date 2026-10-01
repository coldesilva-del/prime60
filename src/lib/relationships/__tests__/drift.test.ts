import { describe, expect, it } from "vitest";
import { cadenceWords, daysSince, driftNote, isDrifting, sinceWords } from "../drift";

describe("cadenceWords", () => {
  it("names the four standard cadences", () => {
    expect(cadenceWords(1)).toBe("Daily");
    expect(cadenceWords(7)).toBe("Weekly");
    expect(cadenceWords(14)).toBe("Fortnightly");
    expect(cadenceWords(30)).toBe("Monthly");
    expect(cadenceWords(10)).toBe("Every 10 days");
  });
});

describe("isDrifting", () => {
  const today = "2026-10-01";
  it("is true only when days since exceed twice the cadence", () => {
    expect(isDrifting("2026-09-17", 7, today)).toBe(false); // exactly 14
    expect(isDrifting("2026-09-16", 7, today)).toBe(true); // 15
    expect(isDrifting("2026-09-29", 1, today)).toBe(false); // 2
    expect(isDrifting("2026-09-28", 1, today)).toBe(true); // 3
  });
  it("never drifts when there has been no interaction yet", () => {
    expect(isDrifting(null, 7, today)).toBe(false);
    expect(daysSince(null, today)).toBeNull();
  });
  it("reads as a gentle note, never overdue", () => {
    expect(driftNote("Olivia")).toBe("It has been a while since you and Olivia connected");
    expect(driftNote("Olivia")).not.toMatch(/overdue/i);
  });
});

describe("sinceWords", () => {
  it("reads naturally", () => {
    expect(sinceWords("2026-10-01", "2026-10-01")).toBe("Today");
    expect(sinceWords("2026-09-30", "2026-10-01")).toBe("Yesterday");
    expect(sinceWords("2026-09-25", "2026-10-01")).toBe("6 days ago");
    expect(sinceWords(null, "2026-10-01")).toBe("No interactions yet");
  });
});
