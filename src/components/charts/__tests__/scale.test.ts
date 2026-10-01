import { describe, expect, it } from "vitest";
import { formatTick, linePath, niceDomain, niceStep, positionPoints, yPos } from "../scale";

describe("niceStep", () => {
  it("snaps to 1, 2, 2.5, 5 times a power of ten", () => {
    expect(niceStep(0.7)).toBe(1);
    expect(niceStep(1.5)).toBe(2);
    expect(niceStep(2.2)).toBe(2.5);
    expect(niceStep(4)).toBe(5);
    expect(niceStep(7)).toBe(10);
    expect(niceStep(30)).toBe(50);
  });
});

describe("niceDomain", () => {
  it("covers every value including a target above the data (rising target)", () => {
    const d = niceDomain([69.5, 70.2, 71, 77]);
    expect(d.min).toBeLessThanOrEqual(69.5);
    expect(d.max).toBeGreaterThanOrEqual(77);
    expect(d.ticks[0]).toBe(d.min);
    expect(d.ticks[d.ticks.length - 1]).toBe(d.max);
  });
  it("never inverts and pads a flat series", () => {
    const d = niceDomain([70, 70, 70]);
    expect(d.max).toBeGreaterThan(d.min);
    expect(yPos(70, d)).toBeGreaterThan(0);
    expect(yPos(70, d)).toBeLessThan(100);
  });
  it("falls back for empty input", () => {
    expect(niceDomain([])).toEqual({ min: 0, max: 100, ticks: [0, 50, 100] });
  });
});

describe("positionPoints", () => {
  it("spaces points by date, not by index, with 0 at the top", () => {
    const d = { min: 0, max: 100, ticks: [0, 50, 100] };
    const pts = positionPoints(
      [
        { date: "2026-09-01", value: 100 },
        { date: "2026-09-03", value: 0 },
        { date: "2026-09-02", value: 50 },
      ],
      d,
    );
    expect(pts.map((p) => p.x)).toEqual([0, 50, 100]);
    expect(pts.map((p) => p.y)).toEqual([0, 50, 100]);
    expect(linePath(pts)).toBe("M0 0 L50 50 L100 100");
  });
  it("centres a single point", () => {
    const d = { min: 0, max: 100, ticks: [0, 100] };
    expect(positionPoints([{ date: "2026-09-01", value: 50 }], d)[0].x).toBe(50);
  });
});

describe("formatTick", () => {
  it("keeps one decimal for small non-integers only", () => {
    expect(formatTick(72)).toBe("72");
    expect(formatTick(72.5)).toBe("72.5");
    expect(formatTick(1200)).toBe("1,200");
  });
});
