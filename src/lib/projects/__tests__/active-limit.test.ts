import { describe, expect, it } from "vitest";
import { exceedsLimit, planActivation } from "../active-limit";

describe("exceedsLimit", () => {
  it("allows up to the limit", () => {
    expect(exceedsLimit(0, 3)).toBe(false);
    expect(exceedsLimit(2, 3)).toBe(false);
  });
  it("blocks the one past the limit", () => {
    expect(exceedsLimit(3, 3)).toBe(true);
    expect(exceedsLimit(5, 3)).toBe(true);
  });
  it("treats a limit under one as one", () => {
    expect(exceedsLimit(0, 0)).toBe(false);
    expect(exceedsLimit(1, 0)).toBe(true);
  });
});

describe("planActivation", () => {
  const base = { targetId: 10, targetStatus: "idea" as const, limit: 3 };

  it("activates directly when under the limit", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2] });
    expect(plan).toEqual({
      kind: "activate",
      overridden: false,
      steps: [{ projectId: 10, toStatus: "active", note: null }],
    });
  });

  it("is a no-op when the project is already active", () => {
    const plan = planActivation({ ...base, targetStatus: "active", activeIds: [1, 2, 10] });
    expect(plan).toEqual({ kind: "activate", overridden: false, steps: [] });
  });

  it("ignores the target in the active count", () => {
    const plan = planActivation({ ...base, targetStatus: "paused", activeIds: [1, 2, 10] });
    expect(plan.kind).toBe("activate");
  });

  it("asks for a choice on the fourth active project", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3] });
    expect(plan).toEqual({ kind: "needs_choice", activeCount: 3, limit: 3 });
  });

  it("finishes one first, then activates", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3], choice: { kind: "finish", projectId: 2 } });
    expect(plan.kind).toBe("activate");
    if (plan.kind !== "activate") return;
    expect(plan.overridden).toBe(false);
    expect(plan.steps.map((s) => [s.projectId, s.toStatus])).toEqual([
      [2, "finished"],
      [10, "active"],
    ]);
  });

  it("pauses one, then activates", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3], choice: { kind: "pause", projectId: 1 } });
    if (plan.kind !== "activate") throw new Error("expected activate");
    expect(plan.steps[0]).toMatchObject({ projectId: 1, toStatus: "paused" });
    expect(plan.steps[1]).toMatchObject({ projectId: 10, toStatus: "active" });
  });

  it("kills one, then activates", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3], choice: { kind: "kill", projectId: 3 } });
    if (plan.kind !== "activate") throw new Error("expected activate");
    expect(plan.steps[0]).toMatchObject({ projectId: 3, toStatus: "killed" });
  });

  it("rejects a replacement that is not active", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3], choice: { kind: "finish", projectId: 99 } });
    expect(plan.kind).toBe("invalid");
  });

  it("parks the project back to idea", () => {
    const plan = planActivation({ ...base, targetStatus: "paused", activeIds: [1, 2, 3], choice: { kind: "park" } });
    expect(plan).toEqual({
      kind: "park",
      steps: [{ projectId: 10, toStatus: "idea", note: "parked at the active limit" }],
    });
  });

  it("parks without a status step when already an idea", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3], choice: { kind: "park" } });
    expect(plan).toEqual({ kind: "park", steps: [] });
  });

  it("overrides and records it in the note", () => {
    const plan = planActivation({ ...base, activeIds: [1, 2, 3], choice: { kind: "override" } });
    expect(plan).toEqual({
      kind: "activate",
      overridden: true,
      steps: [{ projectId: 10, toStatus: "active", note: "override" }],
    });
  });
});
