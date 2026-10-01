import { describe, expect, it } from "vitest";
import { changeWord, comparisonLine, mean, percent, plural } from "../metrics";

describe("changeWord", () => {
  it("uses fewer, more and steady, never good or bad", () => {
    expect(changeWord(12, 7)).toBe("fewer");
    expect(changeWord(4, 9)).toBe("more");
    expect(changeWord(3, 3)).toBe("steady");
  });
});

describe("comparisonLine", () => {
  it("reads as then, now, word", () => {
    expect(comparisonLine(12, 7)).toBe("12 then, 7 now, fewer");
  });
  it("falls back when there is no earlier period", () => {
    expect(comparisonLine(null, 5)).toBe("5 in this period");
  });
});

describe("arithmetic", () => {
  it("mean and percent are null on empty input", () => {
    expect(mean([])).toBeNull();
    expect(mean([2, 4])).toBe(3);
    expect(percent(1, 0)).toBeNull();
    expect(percent(21, 30)).toBe(70);
  });
  it("plural", () => {
    expect(plural(1, "miss", "misses")).toBe("1 miss");
    expect(plural(3, "miss", "misses")).toBe("3 misses");
    expect(plural(2, "day")).toBe("2 days");
  });
});
