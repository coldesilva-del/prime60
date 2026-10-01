import { describe, expect, it } from "vitest";
import {
  commitmentValuesFromEvening,
  easeOut,
  entryColumnForScoreKey,
  eveningPrefill,
  patternSummaryLine,
  pickPrompt,
  toScoreInputs,
  type EveningValues,
  type PromptInputs,
} from "../helpers";

describe("entryColumnForScoreKey", () => {
  it("maps every key to its daily_entries column", () => {
    expect(entryColumnForScoreKey("h1", "track")).toBe("trained");
    expect(entryColumnForScoreKey("i1", "track")).toBe("finished_one_thing");
    expect(entryColumnForScoreKey("r1", "track")).toBe("connected");
    expect(entryColumnForScoreKey("r2", "track")).toBe("quality_time");
    expect(entryColumnForScoreKey("p1", "track")).toBe("published");
    expect(entryColumnForScoreKey("p2", "track")).toBe("moved_project");
    expect(entryColumnForScoreKey("p3", "track")).toBe("served");
  });

  it("maps h2 by health mode", () => {
    expect(entryColumnForScoreKey("h2", "track")).toBe("moved");
    expect(entryColumnForScoreKey("h2", "coached")).toBe("logged_with_coach");
  });

  it("has no column for a Courage Rep", () => {
    expect(entryColumnForScoreKey("i2", "track")).toBeNull();
  });
});

describe("pickPrompt", () => {
  const base: PromptInputs = {
    morningDone: true,
    eveningDone: true,
    hour: 9,
    eveningHour: 18,
    dayOfWeek: 2,
    reviewCompleted: true,
    weighInDow: 1,
    weightLoggedToday: true,
  };

  it("shows nothing when the day is fully handled", () => {
    expect(pickPrompt(base)).toBeNull();
  });

  it("puts the morning first, whatever else is pending", () => {
    expect(
      pickPrompt({ ...base, morningDone: false, eveningDone: false, hour: 20, dayOfWeek: 0, reviewCompleted: false }),
    ).toBe("morning");
  });

  it("shows the evening only once the evening hour is reached", () => {
    expect(pickPrompt({ ...base, eveningDone: false, hour: 17 })).toBeNull();
    expect(pickPrompt({ ...base, eveningDone: false, hour: 18 })).toBe("evening");
  });

  it("ranks evening above the weekly review", () => {
    expect(pickPrompt({ ...base, eveningDone: false, hour: 19, dayOfWeek: 0, reviewCompleted: false })).toBe("evening");
    expect(pickPrompt({ ...base, dayOfWeek: 0, reviewCompleted: false })).toBe("review");
  });

  it("shows the weigh-in only on the chosen day with no weight logged", () => {
    expect(pickPrompt({ ...base, dayOfWeek: 1, weightLoggedToday: false })).toBe("weigh_in");
    expect(pickPrompt({ ...base, dayOfWeek: 1, weightLoggedToday: true })).toBeNull();
    expect(pickPrompt({ ...base, dayOfWeek: 3, weighInDow: 1, weightLoggedToday: false })).toBeNull();
  });

  it("ranks the review above the weigh-in on a Sunday weigh-in day", () => {
    expect(pickPrompt({ ...base, dayOfWeek: 0, weighInDow: 0, reviewCompleted: false, weightLoggedToday: false })).toBe(
      "review",
    );
  });
});

describe("patternSummaryLine", () => {
  it("reads naturally", () => {
    expect(patternSummaryLine(0, 0)).toBe("None appeared");
    expect(patternSummaryLine(1, 1)).toBe("2 logged, 1 replaced");
    expect(patternSummaryLine(0, 3)).toBe("3 logged, 3 replaced");
  });
});

describe("eveningPrefill", () => {
  const empty = {
    trained: null,
    moved: null,
    logged_with_coach: null,
    energy: null,
    finished_one_thing: null,
    connected: null,
    quality_time: null,
    published: null,
    moved_project: null,
    served: null,
  };

  it("prefers the entry over the commitments", () => {
    const v = eveningPrefill({ ...empty, trained: false, energy: 7 }, [{ scoreKey: "h1", completed: true }], 0, "track");
    expect(v.trained).toBe(false);
    expect(v.energy).toBe(7);
  });

  it("falls back to a completed commitment and leaves the rest unanswered", () => {
    const v = eveningPrefill(
      empty,
      [
        { scoreKey: "h1", completed: true },
        { scoreKey: "p1", completed: false },
      ],
      0,
      "track",
    );
    expect(v.trained).toBe(true);
    expect(v.published).toBeNull();
    expect(v.connected).toBeNull();
  });

  it("routes h2 to the field for the health mode", () => {
    const c = [{ scoreKey: "h2" as const, completed: true }];
    expect(eveningPrefill(empty, c, 0, "track")).toMatchObject({ moved: true, loggedWithCoach: null });
    expect(eveningPrefill(empty, c, 0, "coached")).toMatchObject({ moved: null, loggedWithCoach: true });
  });

  it("marks a Courage Rep when one exists today", () => {
    expect(eveningPrefill(empty, [], 1, "track").courageRepToday).toBe(true);
    expect(eveningPrefill(empty, [], 0, "track").courageRepToday).toBe(false);
  });
});

describe("toScoreInputs and commitmentValuesFromEvening", () => {
  const values: EveningValues = {
    trained: true,
    moved: null,
    loggedWithCoach: true,
    energy: 8,
    finishedOneThing: false,
    courageRepToday: true,
    connected: true,
    qualityTime: null,
    published: true,
    movedProject: null,
    served: false,
  };

  it("carries the pattern counts and health mode through", () => {
    const inputs = toScoreInputs(values, "coached", { followed: 1, replaced: 2 });
    expect(inputs.healthMode).toBe("coached");
    expect(inputs.patternsFollowed).toBe(1);
    expect(inputs.patternsReplaced).toBe(2);
    expect(inputs.loggedWithCoach).toBe(true);
  });

  it("treats unanswered items as not completed for commitments", () => {
    expect(commitmentValuesFromEvening(values, "coached")).toEqual({
      h1: true,
      h2: true,
      i1: false,
      i2: true,
      r1: true,
      r2: false,
      p1: true,
      p2: false,
      p3: false,
    });
    expect(commitmentValuesFromEvening(values, "track").h2).toBe(false);
  });
});

describe("easeOut", () => {
  it("starts at 0, ends at 1 and clamps", () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(2)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });
});
