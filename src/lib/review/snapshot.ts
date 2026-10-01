/**
 * Weekly review snapshot: the numbers shown in sections A to E, computed from
 * the week's raw rows. Pure, no I/O. Every figure carries the inputs that
 * produced it so the UI can explain any number on tap.
 *
 * The snapshot is frozen into weekly_reviews.snapshot on first save, so later
 * edits to the underlying data do not change what was reviewed.
 */

import { addDays } from "@/lib/dates";
import { computeFinishRatio } from "@/lib/scoring/finish-ratio";

export interface Figure {
  key: string;
  label: string;
  value: string;
  /** One line on how the value was arrived at. */
  note?: string;
  /** The rows behind the number, one per line. */
  inputs: string[];
}

export interface SnapshotEntry {
  entry_date: string;
  evening_done_at: string | null;
  trained: boolean | null;
  energy: number | null;
  published: boolean | null;
  moved_project: boolean | null;
  served: boolean | null;
  connected: boolean | null;
  quality_time: boolean | null;
  finished_one_thing: boolean | null;
}

export interface SnapshotCommitment {
  entry_date: string;
  non_negotiable_id: number;
  completed: boolean;
}

export interface SnapshotNonNegotiable {
  id: number;
  label: string;
}

export interface SnapshotPattern {
  userPatternId: number;
  name: string;
  inFocus: boolean;
  replacement: string;
  ifThen: string;
}

export interface SnapshotOccurrence {
  occurred_on: string;
  user_pattern_id: number;
  response: "followed" | "replaced";
}

export interface SnapshotCourageRep {
  occurred_on: string;
  label: string | null;
}

export interface SnapshotStatusChange {
  projectId: number;
  projectName: string;
  toStatus: string;
  /** ISO timestamp */
  changedAt: string;
}

export interface SnapshotInteraction {
  occurred_on: string;
  person_id: number;
  kind: string;
}

export interface SnapshotPerson {
  id: number;
  name: string;
}

export interface SnapshotMetric {
  metric_date: string;
  weight: number | null;
  body_fat: number | null;
}

export interface SnapshotInputs {
  /** Monday, YYYY-MM-DD */
  weekStart: string;
  entries: SnapshotEntry[];
  commitments: SnapshotCommitment[];
  nonNegotiables: SnapshotNonNegotiable[];
  patterns: SnapshotPattern[];
  occurrences: SnapshotOccurrence[];
  courageReps: SnapshotCourageRep[];
  /** Status changes over at least the last 90 days ending on the week's Sunday. */
  statusChanges: SnapshotStatusChange[];
  interactions: SnapshotInteraction[];
  people: SnapshotPerson[];
  metrics: SnapshotMetric[];
}

export interface MostFrequentPattern {
  userPatternId: number;
  name: string;
  count: number;
  replacement: string;
  ifThen: string;
}

export interface ReviewSnapshot {
  version: 1;
  weekStart: string;
  weekEnd: string;
  computedAt: string;
  loggedDays: number;
  a: Figure[];
  b: Figure[];
  c: Figure[];
  d: Figure[];
  e: { figures: Figure[]; mostFrequent: MostFrequentPattern | null };
}

export const WEEK_DAYS = 7;

/** "Mon 28 Sep" for a YYYY-MM-DD string. */
export function labelDay(day: string): string {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function dayWord(n: number): string {
  return plural(n, "day");
}

function yesNoLine(day: string, value: boolean | null, yes: string, no: string): string {
  if (value === true) return `${labelDay(day)}: ${yes}`;
  if (value === false) return `${labelDay(day)}: ${no}`;
  return `${labelDay(day)}: not recorded`;
}

function countTrue(entries: SnapshotEntry[], key: keyof SnapshotEntry): number {
  return entries.filter((e) => e[key] === true).length;
}

function dayFigure(
  key: string,
  label: string,
  entries: SnapshotEntry[],
  field: keyof SnapshotEntry,
  yes: string,
  no: string,
): Figure {
  const n = countTrue(entries, field);
  return {
    key,
    label,
    value: dayWord(n),
    note: `Days where the evening check-in recorded "${yes}".`,
    inputs: entries.length
      ? entries.map((e) => yesNoLine(e.entry_date, e[field] as boolean | null, yes, no))
      : ["No check-ins this week"],
  };
}

function fmtKg(v: number): string {
  return `${Number.isInteger(v) ? v : v.toFixed(1)} kg`;
}

function sortByDay<T>(rows: T[], key: (row: T) => string): T[] {
  return [...rows].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
}

function uniqueBy<T>(rows: T[], key: (row: T) => number): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const r of rows) {
    const k = key(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

function kindLabel(kind: string): string {
  return kind === "quality_time" ? "quality time" : kind;
}

export function computeSnapshot(input: SnapshotInputs, now: Date = new Date()): ReviewSnapshot {
  const weekStart = input.weekStart;
  const weekEnd = addDays(weekStart, WEEK_DAYS - 1);
  const inWeek = (day: string) => day >= weekStart && day <= weekEnd;

  const entries = sortByDay(
    input.entries.filter((e) => inWeek(e.entry_date)),
    (e) => e.entry_date,
  );
  const logged = entries.filter((e) => e.evening_done_at !== null);
  const loggedDays = logged.length;

  // A Health -----------------------------------------------------------------
  const trainedDays = countTrue(logged, "trained");
  const energies = entries.filter((e) => e.energy != null);
  const meanEnergy = energies.length
    ? energies.reduce((s, e) => s + (e.energy ?? 0), 0) / energies.length
    : null;
  const metrics = sortByDay(
    input.metrics.filter((m) => inWeek(m.metric_date)),
    (m) => m.metric_date,
  );
  const weights = metrics.filter((m) => m.weight != null);
  const fats = metrics.filter((m) => m.body_fat != null);
  const latestFat = fats.length ? fats[fats.length - 1] : null;
  const firstWeight = weights[0]?.weight ?? null;
  const lastWeight = weights[weights.length - 1]?.weight ?? null;

  const a: Figure[] = [
    {
      key: "trained",
      label: "Trained",
      value: `${trainedDays} of ${dayWord(loggedDays)} logged`,
      note: "Logged days are days with an evening check-in.",
      inputs: logged.length
        ? logged.map((e) => yesNoLine(e.entry_date, e.trained, "trained", "did not train"))
        : ["No evening check-ins this week"],
    },
    {
      key: "energy",
      label: "Energy",
      value: meanEnergy == null ? "No readings" : `${(Math.round(meanEnergy * 10) / 10).toFixed(1)} of 10`,
      note: energies.length ? `Mean of ${plural(energies.length, "reading")}.` : undefined,
      inputs: energies.length
        ? energies.map((e) => `${labelDay(e.entry_date)}: ${e.energy} of 10`)
        : ["No energy readings this week"],
    },
    {
      key: "weight",
      label: "Weight",
      value:
        firstWeight == null || lastWeight == null
          ? "No readings"
          : weights.length === 1
            ? `${fmtKg(firstWeight)} (one reading)`
            : `${fmtKg(firstWeight)} to ${fmtKg(lastWeight)}`,
      note: weights.length > 1 ? "First and last readings of the week." : undefined,
      inputs: weights.length
        ? weights.map((m) => `${labelDay(m.metric_date)}: ${fmtKg(m.weight ?? 0)}`)
        : ["No weight readings this week"],
    },
    {
      key: "body_fat",
      label: "Body fat",
      value: latestFat ? `${latestFat.body_fat}%` : "No readings",
      note: latestFat ? `Latest reading, ${labelDay(latestFat.metric_date)}.` : undefined,
      inputs: fats.length
        ? fats.map((m) => `${labelDay(m.metric_date)}: ${m.body_fat}%`)
        : ["No body fat readings this week"],
    },
  ];

  // B Purpose ----------------------------------------------------------------
  const weekStartTs = `${weekStart}T00:00:00.000Z`;
  const weekEndTs = `${weekEnd}T23:59:59.999Z`;
  const weekChanges = input.statusChanges.filter(
    (c) => c.changedAt >= weekStartTs && c.changedAt <= weekEndTs,
  );
  const finishedThisWeek = uniqueBy(
    weekChanges.filter((c) => c.toStatus === "finished"),
    (c) => c.projectId,
  );
  const startedThisWeek = uniqueBy(
    weekChanges.filter((c) => c.toStatus === "active"),
    (c) => c.projectId,
  );
  const projectLines = (rows: SnapshotStatusChange[], empty: string) =>
    rows.length ? rows.map((c) => `${c.projectName}, ${labelDay(c.changedAt.slice(0, 10))}`) : [empty];

  const b: Figure[] = [
    dayFigure("published", "Published", entries, "published", "published", "did not publish"),
    dayFigure("moved_project", "Moved the main project", entries, "moved_project", "moved it", "did not move it"),
    dayFigure("served", "Served someone", entries, "served", "served", "did not serve"),
    {
      key: "projects_finished",
      label: "Projects finished",
      value: `${finishedThisWeek.length}`,
      note: "Projects set to finished this week.",
      inputs: projectLines(finishedThisWeek, "No projects finished this week"),
    },
  ];

  // C Relationships ----------------------------------------------------------
  const interactions = sortByDay(
    input.interactions.filter((i) => inWeek(i.occurred_on)),
    (i) => i.occurred_on,
  );
  const byPerson = new Map<number, SnapshotInteraction[]>();
  for (const i of interactions) {
    const list = byPerson.get(i.person_id) ?? [];
    list.push(i);
    byPerson.set(i.person_id, list);
  }
  const personName = (id: number) => input.people.find((p) => p.id === id)?.name ?? "Someone";
  const personFigures: Figure[] = [...byPerson.entries()]
    .sort((x, y) => y[1].length - x[1].length)
    .map(([personId, list]) => ({
      key: `person_${personId}`,
      label: personName(personId),
      value: plural(list.length, "time"),
      inputs: list.map((i) => `${labelDay(i.occurred_on)}: ${kindLabel(i.kind)}`),
    }));

  const c: Figure[] = [
    ...(personFigures.length
      ? personFigures
      : [{ key: "people", label: "People", value: "No one logged", inputs: ["No interactions logged this week"] }]),
    dayFigure("connected", "Connected", entries, "connected", "connected", "did not connect"),
    dayFigure("quality_time", "Quality time", entries, "quality_time", "quality time", "no quality time"),
  ];

  // D Identity ---------------------------------------------------------------
  const occurrences = sortByDay(
    input.occurrences.filter((o) => inWeek(o.occurred_on)),
    (o) => o.occurred_on,
  );
  const patternName = (id: number) => input.patterns.find((p) => p.userPatternId === id)?.name ?? "Pattern";
  const focusPatterns = input.patterns.filter((p) => p.inFocus);
  const patternFigures: Figure[] = focusPatterns.map((p) => {
    const mine = occurrences.filter((o) => o.user_pattern_id === p.userPatternId);
    const replaced = mine.filter((o) => o.response === "replaced").length;
    const followed = mine.filter((o) => o.response === "followed").length;
    return {
      key: `pattern_${p.userPatternId}`,
      label: p.name,
      value: mine.length === 0 ? "Did not appear" : `${replaced} replaced, ${followed} followed`,
      note: mine.length ? `${plural(mine.length, "appearance")} this week.` : undefined,
      inputs: mine.length
        ? mine.map(
            (o) =>
              `${labelDay(o.occurred_on)}: ${o.response === "replaced" ? "replacement used" : "old response followed"}`,
          )
        : ["No appearances logged this week"],
    };
  });

  const reps = sortByDay(
    input.courageReps.filter((r) => inWeek(r.occurred_on)),
    (r) => r.occurred_on,
  );
  const commitments = sortByDay(
    input.commitments.filter((k) => inWeek(k.entry_date)),
    (k) => k.entry_date,
  );
  const kept = commitments.filter((k) => k.completed).length;
  const nnLabel = (id: number) => input.nonNegotiables.find((n) => n.id === id)?.label ?? "Non-negotiable";

  const ninetyStart = addDays(weekEnd, -89);
  const ratio = computeFinishRatio(
    input.statusChanges.map((s) => ({ projectId: s.projectId, toStatus: s.toStatus, changedAt: s.changedAt })),
    `${ninetyStart}T00:00:00.000Z`,
    weekEndTs,
  );

  const d: Figure[] = [
    ...(patternFigures.length
      ? patternFigures
      : [
          {
            key: "patterns",
            label: "Patterns in focus",
            value: "None chosen",
            inputs: ["Choose up to five patterns in section E"],
          },
        ]),
    {
      key: "courage_reps",
      label: "Courage Reps",
      value: `${reps.length}`,
      inputs: reps.length
        ? reps.map((r) => `${labelDay(r.occurred_on)}: ${r.label ?? "Courage Rep"}`)
        : ["No Courage Reps this week"],
    },
    {
      key: "non_negotiables",
      label: "Non-negotiables kept",
      value: commitments.length ? `${kept} of ${commitments.length}` : "No days logged",
      note: "Each day and each non-negotiable counts once.",
      inputs: commitments.length
        ? commitments.map(
            (k) => `${labelDay(k.entry_date)}: ${nnLabel(k.non_negotiable_id)}, ${k.completed ? "kept" : "missed"}`,
          )
        : ["No commitments recorded this week"],
    },
    {
      key: "projects_started",
      label: "Projects started",
      value: `${startedThisWeek.length}`,
      inputs: projectLines(startedThisWeek, "No projects started this week"),
    },
    {
      key: "projects_finished",
      label: "Projects finished",
      value: `${finishedThisWeek.length}`,
      inputs: projectLines(finishedThisWeek, "No projects finished this week"),
    },
    {
      key: "finish_ratio",
      label: "Finish Ratio, 90 days",
      value:
        ratio.ratio == null
          ? `Building (${plural(ratio.started, "start")})`
          : `${Math.round(ratio.ratio * 100)}% (${ratio.finished} of ${ratio.started})`,
      note: `Finished divided by started between ${labelDay(ninetyStart)} and ${labelDay(weekEnd)}. Shown once there are three starts.`,
      inputs: [
        `${plural(ratio.started, "project")} set to active`,
        `${plural(ratio.finished, "project")} set to finished`,
      ],
    },
  ];

  // E Atomic habits ----------------------------------------------------------
  const counts = new Map<number, number>();
  for (const o of occurrences) counts.set(o.user_pattern_id, (counts.get(o.user_pattern_id) ?? 0) + 1);
  let top: { id: number; count: number } | null = null;
  for (const [id, count] of counts) if (!top || count > top.count) top = { id, count };
  const topPattern = top ? input.patterns.find((p) => p.userPatternId === top?.id) : undefined;
  const mostFrequent: MostFrequentPattern | null =
    top && topPattern
      ? {
          userPatternId: topPattern.userPatternId,
          name: topPattern.name,
          count: top.count,
          replacement: topPattern.replacement,
          ifThen: topPattern.ifThen,
        }
      : null;

  const e: ReviewSnapshot["e"] = {
    figures: [
      {
        key: "most_frequent",
        label: "Appeared most",
        value: mostFrequent
          ? `${mostFrequent.name}, ${plural(mostFrequent.count, "appearance")}`
          : "No appearances logged",
        inputs: occurrences.length
          ? occurrences.map(
              (o) => `${labelDay(o.occurred_on)}: ${patternName(o.user_pattern_id)}, ${o.response}`,
            )
          : ["No pattern appearances this week"],
      },
      {
        key: "total_appearances",
        label: "Appearances in total",
        value: `${occurrences.length}`,
        inputs: [
          `${occurrences.filter((o) => o.response === "replaced").length} met with the replacement`,
          `${occurrences.filter((o) => o.response === "followed").length} where the old response followed`,
        ],
      },
    ],
    mostFrequent,
  };

  return {
    version: 1,
    weekStart,
    weekEnd,
    computedAt: now.toISOString(),
    loggedDays,
    a,
    b,
    c,
    d,
    e,
  };
}

/** Type guard for a snapshot read back from jsonb. */
export function isReviewSnapshot(value: unknown): value is ReviewSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && typeof v.weekStart === "string" && Array.isArray(v.a) && Array.isArray(v.d);
}
