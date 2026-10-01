import { describe, expect, it } from "vitest";
import {
  identitySchema,
  nonNegotiablesSchema,
  parseJsonField,
  patternsSchema,
  peopleSchema,
  welcomeSchema,
} from "../schemas";
import {
  ageIn,
  customScoreKey,
  defaultTargetYear,
  diffPeople,
  nextOnboardingStep,
  parseStep,
  resumeStep,
} from "../steps";

describe("step helpers", () => {
  it("parses only 1 to 9", () => {
    expect(parseStep("1")).toBe(1);
    expect(parseStep("9")).toBe(9);
    expect(parseStep("0")).toBeNull();
    expect(parseStep("10")).toBeNull();
    expect(parseStep("abc")).toBeNull();
    expect(parseStep(undefined)).toBeNull();
  });

  it("clamps the resume step to the visible range", () => {
    expect(resumeStep(0)).toBe(1);
    expect(resumeStep(5)).toBe(5);
    expect(resumeStep(10)).toBe(9);
  });

  it("never moves progress backwards and caps at 10", () => {
    expect(nextOnboardingStep(1, 1)).toBe(2);
    expect(nextOnboardingStep(7, 2)).toBe(7);
    expect(nextOnboardingStep(9, 9)).toBe(10);
    expect(nextOnboardingStep(10, 9)).toBe(10);
  });

  it("computes age in the target year", () => {
    expect(ageIn(2031, 1965)).toBe(66);
    expect(ageIn(2031, null)).toBeNull();
    expect(ageIn(null, 1965)).toBeNull();
    expect(ageIn(1960, 1965)).toBeNull();
  });

  it("defaults the target year to five years out", () => {
    expect(defaultTargetYear(new Date(2026, 9, 1))).toBe(2031);
  });

  it("maps a custom non-negotiable to the first item of its pillar", () => {
    expect(customScoreKey("health")).toBe("h1");
    expect(customScoreKey("identity")).toBe("i1");
    expect(customScoreKey("relationships")).toBe("r1");
    expect(customScoreKey("purpose")).toBe("p1");
  });
});

describe("diffPeople", () => {
  it("inserts new, updates kept and deactivates removed", () => {
    const diff = diffPeople(
      [1, 2, 3],
      [
        { id: 1, group: "partner", name: "Christine", cadenceDays: 1 },
        { id: 3, group: "family", name: "Mum", cadenceDays: 7 },
        { id: null, group: "friends", name: "Dave", cadenceDays: 14 },
        { id: 99, group: "friends", name: "Unknown id", cadenceDays: 14 },
      ],
    );
    expect(diff.update.map((p) => p.id)).toEqual([1, 3]);
    expect(diff.insert.map((p) => p.name)).toEqual(["Dave", "Unknown id"]);
    expect(diff.deactivateIds).toEqual([2]);
  });
});

describe("schemas", () => {
  const year = new Date().getFullYear();

  it("validates the welcome step", () => {
    expect(welcomeSchema.safeParse({ firstName: " Colin ", targetYear: String(year + 5), birthYear: "" }).success).toBe(true);
    const bad = welcomeSchema.safeParse({ firstName: "", targetYear: String(year - 1), birthYear: "abc" });
    expect(bad.success).toBe(false);
    const order = welcomeSchema.safeParse({ firstName: "Colin", targetYear: String(year + 1), birthYear: String(year + 1) });
    expect(order.success).toBe(false);
  });

  it("requires between three and five patterns in focus", () => {
    expect(patternsSchema.safeParse({ focusIds: [1, 2], overrides: {} }).success).toBe(false);
    expect(patternsSchema.safeParse({ focusIds: [1, 2, 3], overrides: {} }).success).toBe(true);
    expect(patternsSchema.safeParse({ focusIds: [1, 2, 3, 4, 5], overrides: {} }).success).toBe(true);
    expect(patternsSchema.safeParse({ focusIds: [1, 2, 3, 4, 5, 6], overrides: {} }).success).toBe(false);
    expect(patternsSchema.safeParse({ focusIds: [1, 1, 2], overrides: {} }).success).toBe(false);
  });

  it("allows one partner and known cadences only", () => {
    const one = peopleSchema.safeParse({ people: [{ id: null, group: "partner", name: "Christine", cadenceDays: 1 }] });
    expect(one.success).toBe(true);
    const two = peopleSchema.safeParse({
      people: [
        { id: null, group: "partner", name: "A", cadenceDays: 1 },
        { id: null, group: "partner", name: "B", cadenceDays: 1 },
      ],
    });
    expect(two.success).toBe(false);
    const odd = peopleSchema.safeParse({ people: [{ id: null, group: "friends", name: "Dave", cadenceDays: 5 }] });
    expect(odd.success).toBe(false);
    expect(peopleSchema.safeParse({ people: [] }).success).toBe(true);
  });

  it("requires exactly three non-negotiables including a custom one", () => {
    expect(nonNegotiablesSchema.safeParse({ catalogueIds: [1, 2, 3], custom: null }).success).toBe(true);
    expect(nonNegotiablesSchema.safeParse({ catalogueIds: [1, 2], custom: { label: "In bed by 10", pillar: "health" } }).success).toBe(true);
    expect(nonNegotiablesSchema.safeParse({ catalogueIds: [1, 2], custom: null }).success).toBe(false);
    expect(nonNegotiablesSchema.safeParse({ catalogueIds: [1, 2, 3], custom: { label: "Extra", pillar: "health" } }).success).toBe(false);
    expect(nonNegotiablesSchema.safeParse({ catalogueIds: [1, 2], custom: { label: "", pillar: "health" } }).success).toBe(false);
  });

  it("validates identity and optional health targets", () => {
    const ok = identitySchema.safeParse({
      statement: "I am someone who finishes what he starts.",
      healthMode: "track",
      startingWeight: "69.5",
      targetWeight: "77",
      targetBodyFatLow: "",
      targetBodyFatHigh: "",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.startingWeight).toBe(69.5);
      expect(ok.data.targetBodyFatLow).toBeUndefined();
    }
    const range = identitySchema.safeParse({
      statement: "I am.",
      healthMode: "coached",
      targetBodyFatLow: "15",
      targetBodyFatHigh: "10",
    });
    expect(range.success).toBe(false);
    expect(identitySchema.safeParse({ statement: "", healthMode: "track" }).success).toBe(false);
  });

  it("parses JSON hidden fields defensively", () => {
    expect(parseJsonField('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonField("not json")).toBeNull();
    expect(parseJsonField(null)).toBeNull();
    expect(parseJsonField("")).toBeNull();
  });
});
