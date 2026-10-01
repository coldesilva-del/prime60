/**
 * Pure helpers for the daily loop (Today, morning and evening check-ins).
 * No I/O here; everything is unit tested in __tests__/helpers.test.ts.
 */

import type { DailyEntryRow, ScoreKey } from "@/lib/supabase/types";
import type { EveningInputs } from "@/lib/scoring/score";
import type { Direction } from "@/lib/scoring/trajectory";

export type HealthMode = "track" | "coached";

/** daily_entries boolean columns that a score key can mirror onto. */
export type EntryBooleanColumn =
  | "trained"
  | "moved"
  | "logged_with_coach"
  | "finished_one_thing"
  | "connected"
  | "quality_time"
  | "published"
  | "moved_project"
  | "served";

/**
 * Which daily_entries column a non-negotiable writes when it is tapped.
 * i2 (Courage Rep) has no column: it is evidenced by a courage_reps row.
 */
export function entryColumnForScoreKey(key: ScoreKey, healthMode: HealthMode): EntryBooleanColumn | null {
  switch (key) {
    case "h1":
      return "trained";
    case "h2":
      return healthMode === "track" ? "moved" : "logged_with_coach";
    case "i1":
      return "finished_one_thing";
    case "i2":
      return null;
    case "r1":
      return "connected";
    case "r2":
      return "quality_time";
    case "p1":
      return "published";
    case "p2":
      return "moved_project";
    case "p3":
      return "served";
  }
}

export type PromptKind = "morning" | "evening" | "review" | "weigh_in";

export interface PromptInputs {
  morningDone: boolean;
  eveningDone: boolean;
  /** Current hour, 0 to 23, in the user's timezone. */
  hour: number;
  /** profile.evening_hour */
  eveningHour: number;
  /** 0 Sunday to 6 Saturday, in the user's timezone. */
  dayOfWeek: number;
  reviewCompleted: boolean;
  /** profile.weigh_in_dow */
  weighInDow: number;
  weightLoggedToday: boolean;
}

/**
 * At most one prompt shows on Today. Priority: morning, evening, weekly review, weigh-in.
 * See docs/02-information-architecture.md section 5.
 */
export function pickPrompt(i: PromptInputs): PromptKind | null {
  if (!i.morningDone) return "morning";
  if (i.hour >= i.eveningHour && !i.eveningDone) return "evening";
  if (i.dayOfWeek === 0 && !i.reviewCompleted) return "review";
  if (i.dayOfWeek === i.weighInDow && !i.weightLoggedToday) return "weigh_in";
  return null;
}

export const PROMPTS: Record<PromptKind, { text: string; href: string; actionLabel: string }> = {
  morning: { text: "Set up the day in two minutes.", href: "/today/morning", actionLabel: "Start the morning" },
  evening: { text: "Record what happened and reveal your score.", href: "/today/evening", actionLabel: "Close the day" },
  review: { text: "Sunday. Look back at the week.", href: "/today/review", actionLabel: "Weekly review" },
  weigh_in: { text: "Weigh-in day.", href: "/progress/health/log", actionLabel: "Weigh in" },
};

export function directionWord(direction: Direction | null): string {
  switch (direction) {
    case "rising":
      return "Rising";
    case "easing":
      return "Easing";
    default:
      return "Steady";
  }
}

/** Read-only summary line for old patterns on the evening screen. */
export function patternSummaryLine(followed: number, replaced: number): string {
  const total = followed + replaced;
  if (total === 0) return "None appeared";
  return `${total} logged, ${replaced} replaced`;
}

export interface CommitmentState {
  scoreKey: ScoreKey;
  completed: boolean;
}

export interface EveningValues {
  trained: boolean | null;
  moved: boolean | null;
  loggedWithCoach: boolean | null;
  energy: number | null;
  finishedOneThing: boolean | null;
  courageRepToday: boolean;
  connected: boolean | null;
  qualityTime: boolean | null;
  published: boolean | null;
  movedProject: boolean | null;
  served: boolean | null;
}

function fromCommitment(commitments: CommitmentState[], key: ScoreKey): true | null {
  return commitments.some((c) => c.scoreKey === key && c.completed) ? true : null;
}

/**
 * Pre-fills the evening form from the entry (taps during the day mirror onto it),
 * falling back to today's commitments so nothing recorded is asked twice.
 */
export function eveningPrefill(
  entry: Pick<
    DailyEntryRow,
    | "trained"
    | "moved"
    | "logged_with_coach"
    | "energy"
    | "finished_one_thing"
    | "connected"
    | "quality_time"
    | "published"
    | "moved_project"
    | "served"
  >,
  commitments: CommitmentState[],
  courageRepsToday: number,
  healthMode: HealthMode,
): EveningValues {
  const h2 = fromCommitment(commitments, "h2");
  return {
    trained: entry.trained ?? fromCommitment(commitments, "h1"),
    moved: entry.moved ?? (healthMode === "track" ? h2 : null),
    loggedWithCoach: entry.logged_with_coach ?? (healthMode === "coached" ? h2 : null),
    energy: entry.energy,
    finishedOneThing: entry.finished_one_thing ?? fromCommitment(commitments, "i1"),
    courageRepToday: courageRepsToday > 0,
    connected: entry.connected ?? fromCommitment(commitments, "r1"),
    qualityTime: entry.quality_time ?? fromCommitment(commitments, "r2"),
    published: entry.published ?? fromCommitment(commitments, "p1"),
    movedProject: entry.moved_project ?? fromCommitment(commitments, "p2"),
    served: entry.served ?? fromCommitment(commitments, "p3"),
  };
}

/** Builds the scoring input from evening values plus the day's evidence. */
export function toScoreInputs(
  values: EveningValues,
  healthMode: HealthMode,
  patterns: { followed: number; replaced: number },
): EveningInputs {
  return {
    healthMode,
    trained: values.trained,
    moved: values.moved,
    loggedWithCoach: values.loggedWithCoach,
    energy: values.energy,
    finishedOneThing: values.finishedOneThing,
    courageRepToday: values.courageRepToday,
    patternsFollowed: patterns.followed,
    patternsReplaced: patterns.replaced,
    connected: values.connected,
    qualityTime: values.qualityTime,
    published: values.published,
    movedProject: values.movedProject,
    served: values.served,
  };
}

/** The value each score key should carry into daily_commitments after the evening save. */
export function commitmentValuesFromEvening(values: EveningValues, healthMode: HealthMode): Record<ScoreKey, boolean> {
  return {
    h1: values.trained === true,
    h2: healthMode === "track" ? values.moved === true : values.loggedWithCoach === true,
    i1: values.finishedOneThing === true,
    i2: values.courageRepToday,
    r1: values.connected === true,
    r2: values.qualityTime === true,
    p1: values.published === true,
    p2: values.movedProject === true,
    p3: values.served === true,
  };
}

/** Ease-out used by the score reveal. */
export function easeOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}
