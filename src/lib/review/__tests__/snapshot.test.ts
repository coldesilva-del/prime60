import { describe, expect, it } from "vitest";
import { computeSnapshot, isReviewSnapshot, labelDay, type SnapshotInputs } from "../snapshot";

const WEEK = "2026-09-28"; // Monday

function entry(day: string, over: Partial<SnapshotInputs["entries"][number]> = {}) {
  return {
    entry_date: day,
    evening_done_at: `${day}T09:00:00.000Z`,
    trained: null,
    energy: null,
    published: null,
    moved_project: null,
    served: null,
    connected: null,
    quality_time: null,
    finished_one_thing: null,
    ...over,
  };
}

function empty(): SnapshotInputs {
  return {
    weekStart: WEEK,
    entries: [],
    commitments: [],
    nonNegotiables: [],
    patterns: [],
    occurrences: [],
    courageReps: [],
    statusChanges: [],
    interactions: [],
    people: [],
    metrics: [],
  };
}

function figure(list: { key: string; value: string; inputs: string[] }[], key: string) {
  const f = list.find((x) => x.key === key);
  if (!f) throw new Error(`missing figure ${key}`);
  return f;
}

describe("computeSnapshot", () => {
  it("sets the week bounds and a stable shape with no data", () => {
    const s = computeSnapshot(empty(), new Date("2026-10-04T10:00:00Z"));
    expect(s.weekStart).toBe("2026-09-28");
    expect(s.weekEnd).toBe("2026-10-04");
    expect(s.loggedDays).toBe(0);
    expect(figure(s.a, "trained").value).toBe("0 of 0 days logged");
    expect(figure(s.a, "energy").value).toBe("No readings");
    expect(figure(s.a, "weight").value).toBe("No readings");
    expect(figure(s.c, "people").value).toBe("No one logged");
    expect(figure(s.d, "finish_ratio").value).toBe("Building (0 starts)");
    expect(s.e.mostFrequent).toBeNull();
    expect(isReviewSnapshot(s)).toBe(true);
    expect(isReviewSnapshot(JSON.parse(JSON.stringify(s)))).toBe(true);
  });

  it("counts trained days over logged days only and averages energy", () => {
    const input = empty();
    input.entries = [
      entry("2026-09-28", { trained: true, energy: 7 }),
      entry("2026-09-29", { trained: false, energy: 5 }),
      entry("2026-09-30", { trained: true, energy: 8 }),
      // morning only, no evening check-in: not a logged day
      entry("2026-10-01", { evening_done_at: null, trained: true }),
      // outside the week, ignored
      entry("2026-10-05", { trained: true, energy: 10 }),
    ];
    const s = computeSnapshot(input);
    expect(s.loggedDays).toBe(3);
    expect(figure(s.a, "trained").value).toBe("2 of 3 days logged");
    expect(figure(s.a, "energy").value).toBe("6.7 of 10");
    expect(figure(s.a, "energy").inputs).toHaveLength(3);
  });

  it("shows weight start and end of week and the latest body fat", () => {
    const input = empty();
    input.metrics = [
      { metric_date: "2026-10-03", weight: 71.9, body_fat: null },
      { metric_date: "2026-09-28", weight: 72.4, body_fat: 11.5 },
      { metric_date: "2026-09-30", weight: null, body_fat: 11.2 },
      { metric_date: "2026-09-20", weight: 80, body_fat: 20 },
    ];
    const s = computeSnapshot(input);
    expect(figure(s.a, "weight").value).toBe("72.4 kg to 71.9 kg");
    expect(figure(s.a, "body_fat").value).toBe("11.2%");

    input.metrics = [{ metric_date: "2026-09-29", weight: 72, body_fat: null }];
    expect(figure(computeSnapshot(input).a, "weight").value).toBe("72 kg (one reading)");
  });

  it("counts purpose days and projects finished in the week", () => {
    const input = empty();
    input.entries = [
      entry("2026-09-28", { published: true, moved_project: true, served: false }),
      entry("2026-09-29", { published: true, moved_project: false, served: true }),
    ];
    input.statusChanges = [
      { projectId: 1, projectName: "Prime 60", toStatus: "finished", changedAt: "2026-10-02T03:00:00.000Z" },
      { projectId: 2, projectName: "Old site", toStatus: "finished", changedAt: "2026-09-01T03:00:00.000Z" },
    ];
    const s = computeSnapshot(input);
    expect(figure(s.b, "published").value).toBe("2 days");
    expect(figure(s.b, "moved_project").value).toBe("1 day");
    expect(figure(s.b, "served").value).toBe("1 day");
    expect(figure(s.b, "projects_finished").value).toBe("1");
    expect(figure(s.b, "projects_finished").inputs[0]).toContain("Prime 60");
  });

  it("groups interactions per person, most frequent first", () => {
    const input = empty();
    input.people = [
      { id: 10, name: "Christine" },
      { id: 11, name: "Olivia" },
    ];
    input.interactions = [
      { occurred_on: "2026-09-28", person_id: 11, kind: "contact" },
      { occurred_on: "2026-09-29", person_id: 10, kind: "quality_time" },
      { occurred_on: "2026-10-01", person_id: 10, kind: "conversation" },
      { occurred_on: "2026-10-06", person_id: 10, kind: "contact" },
    ];
    input.entries = [entry("2026-09-29", { connected: true, quality_time: true })];
    const s = computeSnapshot(input);
    expect(s.c[0].label).toBe("Christine");
    expect(s.c[0].value).toBe("2 times");
    expect(s.c[0].inputs[0]).toBe(`${labelDay("2026-09-29")}: quality time`);
    expect(s.c[1].label).toBe("Olivia");
    expect(s.c[1].value).toBe("1 time");
    expect(figure(s.c, "connected").value).toBe("1 day");
    expect(figure(s.c, "quality_time").value).toBe("1 day");
  });

  it("reports in-focus patterns, reps, commitments and the 90-day Finish Ratio", () => {
    const input = empty();
    input.patterns = [
      { userPatternId: 1, name: "Procrastination", inFocus: true, replacement: "Start for two minutes.", ifThen: "If, then." },
      { userPatternId: 2, name: "Hiding", inFocus: true, replacement: "Publish small.", ifThen: "If hiding, then publish." },
      { userPatternId: 3, name: "Overthinking", inFocus: false, replacement: "Act.", ifThen: "If, then act." },
    ];
    input.occurrences = [
      { occurred_on: "2026-09-28", user_pattern_id: 1, response: "followed" },
      { occurred_on: "2026-09-29", user_pattern_id: 1, response: "replaced" },
      { occurred_on: "2026-09-30", user_pattern_id: 1, response: "replaced" },
      { occurred_on: "2026-10-01", user_pattern_id: 3, response: "followed" },
    ];
    input.courageReps = [
      { occurred_on: "2026-09-30", label: "Published the video" },
      { occurred_on: "2026-09-21", label: "Old rep" },
    ];
    input.nonNegotiables = [
      { id: 1, label: "Train" },
      { id: 2, label: "Publish" },
    ];
    input.commitments = [
      { entry_date: "2026-09-28", non_negotiable_id: 1, completed: true },
      { entry_date: "2026-09-28", non_negotiable_id: 2, completed: false },
      { entry_date: "2026-09-29", non_negotiable_id: 1, completed: true },
    ];
    input.statusChanges = [
      { projectId: 1, projectName: "A", toStatus: "active", changedAt: "2026-07-10T00:00:00.000Z" },
      { projectId: 2, projectName: "B", toStatus: "active", changedAt: "2026-08-10T00:00:00.000Z" },
      { projectId: 3, projectName: "C", toStatus: "active", changedAt: "2026-09-29T00:00:00.000Z" },
      { projectId: 1, projectName: "A", toStatus: "finished", changedAt: "2026-09-15T00:00:00.000Z" },
      { projectId: 2, projectName: "B", toStatus: "finished", changedAt: "2026-10-04T20:00:00.000Z" },
      // before the 90-day window (window starts 2026-07-07)
      { projectId: 9, projectName: "Z", toStatus: "active", changedAt: "2026-07-01T00:00:00.000Z" },
    ];
    const s = computeSnapshot(input);
    expect(figure(s.d, "pattern_1").value).toBe("2 replaced, 1 followed");
    expect(figure(s.d, "pattern_2").value).toBe("Did not appear");
    expect(s.d.find((f) => f.key === "pattern_3")).toBeUndefined();
    expect(figure(s.d, "courage_reps").value).toBe("1");
    expect(figure(s.d, "non_negotiables").value).toBe("2 of 3");
    expect(figure(s.d, "projects_started").value).toBe("1");
    expect(figure(s.d, "projects_finished").value).toBe("1");
    expect(figure(s.d, "finish_ratio").value).toBe("67% (2 of 3)");
  });

  it("picks the most frequent pattern of the week with its replacement", () => {
    const input = empty();
    input.patterns = [
      { userPatternId: 1, name: "Procrastination", inFocus: true, replacement: "Start for two minutes.", ifThen: "If I put it off, then I start." },
      { userPatternId: 3, name: "Overthinking", inFocus: false, replacement: "Act.", ifThen: "If thinking, then act." },
    ];
    input.occurrences = [
      { occurred_on: "2026-09-28", user_pattern_id: 1, response: "followed" },
      { occurred_on: "2026-09-29", user_pattern_id: 3, response: "followed" },
      { occurred_on: "2026-10-02", user_pattern_id: 3, response: "replaced" },
    ];
    const s = computeSnapshot(input);
    expect(s.e.mostFrequent).toEqual({
      userPatternId: 3,
      name: "Overthinking",
      count: 2,
      replacement: "Act.",
      ifThen: "If thinking, then act.",
    });
    expect(figure(s.e.figures, "most_frequent").value).toBe("Overthinking, 2 appearances");
    expect(figure(s.e.figures, "total_appearances").value).toBe("3");
  });
});
