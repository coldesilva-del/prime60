import { describe, expect, it } from "vitest";
import { inWindow, parsePeriod, periodWindow, periodWords, queryFloor } from "../periods";

describe("parsePeriod", () => {
  it("defaults to 30", () => {
    expect(parsePeriod(undefined)).toBe(30);
    expect(parsePeriod("14")).toBe(30);
    expect(parsePeriod("")).toBe(30);
  });
  it("accepts the five periods", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod("90")).toBe(90);
    expect(parsePeriod("365")).toBe(365);
    expect(parsePeriod("all")).toBe("all");
    expect(parsePeriod(["7", "30"])).toBe(7);
  });
});

describe("periodWindow", () => {
  it("builds an inclusive window ending today with the equal window before", () => {
    const w = periodWindow(7, "2026-10-01");
    expect(w.start).toBe("2026-09-25");
    expect(w.end).toBe("2026-10-01");
    expect(w.days).toBe(7);
    expect(w.previous).toEqual({ start: "2026-09-18", end: "2026-09-24" });
    expect(queryFloor(w)).toBe("2026-09-18");
  });
  it("crosses month and year boundaries", () => {
    const w = periodWindow(30, "2026-01-10");
    expect(w.start).toBe("2025-12-12");
    expect(w.previous?.start).toBe("2025-11-12");
  });
  it("has no bounds for all time", () => {
    const w = periodWindow("all", "2026-10-01");
    expect(w.start).toBeNull();
    expect(w.previous).toBeNull();
    expect(queryFloor(w)).toBeNull();
    expect(periodWords("all")).toBe("all time");
  });
});

describe("inWindow", () => {
  it("is inclusive at both ends", () => {
    expect(inWindow("2026-09-25", "2026-09-25", "2026-10-01")).toBe(true);
    expect(inWindow("2026-10-01", "2026-09-25", "2026-10-01")).toBe(true);
    expect(inWindow("2026-09-24", "2026-09-25", "2026-10-01")).toBe(false);
    expect(inWindow("2020-01-01", null, "2026-10-01")).toBe(true);
  });
});
