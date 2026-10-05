import type { GroupKey, NorthStarSection, Pillar, ScoreKey } from "@/lib/supabase/types";

/**
 * Pure onboarding constants and helpers. No server imports so they can be
 * shared by client components and tested in isolation.
 */

export const STEP_COUNT = 9;
export const COMPLETE_STEP = 10;

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const STEP_TITLES: Record<StepNumber, string> = {
  1: "Welcome",
  2: "Health",
  3: "Purpose",
  4: "Relationships",
  5: "Lifestyle and Your Moment",
  6: "Old patterns",
  7: "People",
  8: "Non-negotiables",
  9: "Identity and health",
};

/** Parses a route segment into a step number, or null when it is not one. */
export function parseStep(value: string | undefined): StepNumber | null {
  if (!value || !/^[1-9]$/.test(value)) return null;
  return Number(value) as StepNumber;
}

/** The step a user may resume from, clamped to the visible range. */
export function resumeStep(onboardingStep: number): StepNumber {
  return Math.min(Math.max(Math.trunc(onboardingStep), 1), STEP_COUNT) as StepNumber;
}

/** The saved progress after finishing `step`, never moving backwards. */
export function nextOnboardingStep(current: number, step: StepNumber): number {
  return Math.min(Math.max(current, step + 1), COMPLETE_STEP);
}

export function stepHref(step: number): string {
  return `/welcome/${step}`;
}

/** Age in the target year, or null when a birth year is not known. */
export function ageIn(targetYear: number | null, birthYear: number | null): number | null {
  if (!targetYear || !birthYear) return null;
  const age = targetYear - birthYear;
  return age > 0 && age < 130 ? age : null;
}

export const NORTH_STAR_STEPS: Record<2 | 3 | 4, { section: NorthStarSection; exampleKey: string }> = {
  2: { section: "health", exampleKey: "example_health" },
  3: { section: "purpose", exampleKey: "example_purpose" },
  4: { section: "relationships", exampleKey: "example_relationships" },
};

/** Worked examples offered per North Star section. */
export const EXAMPLE_COUNT = 10;

/** Snippet keys for a section: the original example, then numbered ones. */
export function exampleKeys(base: string): string[] {
  return [base, ...Array.from({ length: EXAMPLE_COUNT - 1 }, (_, i) => `${base}_${i + 2}`)];
}

/** The examples that exist for a section, in key order. */
export function examplesFrom(snippets: Record<string, string | undefined>, base: string): string[] {
  return exampleKeys(base)
    .map((key) => snippets[key])
    .filter((body): body is string => Boolean(body));
}

export const MIN_FOCUS = 3;
export const MAX_FOCUS = 5;

export const CADENCE_OPTIONS = [
  { value: 1, label: "Daily" },
  { value: 3, label: "Every few days" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Fortnightly" },
  { value: 30, label: "Monthly" },
] as const;

export type CadenceDays = (typeof CADENCE_OPTIONS)[number]["value"];
export const CADENCE_VALUES: readonly number[] = CADENCE_OPTIONS.map((o) => o.value);

export function isCadence(value: number): value is CadenceDays {
  return CADENCE_VALUES.includes(value);
}

export const GROUP_DEFAULTS: { key: GroupKey; label: string; cadence: CadenceDays; sortOrder: number }[] = [
  { key: "partner", label: "Partner", cadence: 1, sortOrder: 1 },
  { key: "children", label: "Children", cadence: 7, sortOrder: 2 },
  { key: "family", label: "Family", cadence: 7, sortOrder: 3 },
  { key: "friends", label: "Friends", cadence: 14, sortOrder: 4 },
  { key: "community", label: "Community", cadence: 30, sortOrder: 5 },
];

export const GROUP_KEYS = GROUP_DEFAULTS.map((g) => g.key) as [GroupKey, ...GroupKey[]];

export const NON_NEGOTIABLE_COUNT = 3;
export const DEFAULT_NON_NEGOTIABLE_SLUGS = ["train", "publish", "connect"];

export const PILLARS: { value: Pillar; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "identity", label: "Identity" },
  { value: "relationships", label: "Relationships" },
  { value: "purpose", label: "Purpose" },
];

export const PILLAR_VALUES = PILLARS.map((p) => p.value) as [Pillar, ...Pillar[]];

/** A custom non-negotiable maps to the first score item of its pillar. */
export function customScoreKey(pillar: Pillar): ScoreKey {
  switch (pillar) {
    case "health":
      return "h1";
    case "identity":
      return "i1";
    case "relationships":
      return "r1";
    case "purpose":
      return "p1";
  }
}

/** Default target year: sign-up year plus five. */
export function defaultTargetYear(now: Date = new Date()): number {
  return now.getFullYear() + 5;
}

export type PersonDraft = {
  id: number | null;
  group: GroupKey;
  name: string;
  cadenceDays: number;
};

export type PeopleDiff = {
  insert: PersonDraft[];
  update: (PersonDraft & { id: number })[];
  deactivateIds: number[];
};

/**
 * Works out which people rows to insert, update and deactivate so that the
 * saved list matches `submitted`. Rows the user removed are deactivated,
 * never deleted, so past interactions keep their person.
 */
export function diffPeople(existingIds: number[], submitted: PersonDraft[]): PeopleDiff {
  const existing = new Set(existingIds);
  const insert: PersonDraft[] = [];
  const update: (PersonDraft & { id: number })[] = [];
  const kept = new Set<number>();
  for (const p of submitted) {
    if (p.id !== null && existing.has(p.id)) {
      update.push({ ...p, id: p.id });
      kept.add(p.id);
    } else {
      insert.push({ ...p, id: null });
    }
  }
  const deactivateIds = existingIds.filter((id) => !kept.has(id));
  return { insert, update, deactivateIds };
}
