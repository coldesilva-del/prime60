import { addDays, todayIn, weekStart, type DayString } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { computeFinishRatio, type FinishRatio } from "@/lib/scoring/finish-ratio";
import { computeReturnRate, type ReturnRate } from "@/lib/scoring/return-rate";
import { PILLAR_WEIGHTS, type Pillar } from "@/lib/scoring/score";
import { computeTrajectory, type DailyScoreRow, type Trajectory } from "@/lib/scoring/trajectory";
import { createClient } from "@/lib/supabase/server";
import type { InteractionKind } from "@/lib/supabase/types";
import { comparisonLine, percent, PILLAR_LABEL, plural } from "./metrics";
import { inWindow, periodWindow, periodWords, queryFloor, type Period, type PeriodWindow } from "./periods";
import type { Explain, MetricRowData } from "./types";

const TRAJECTORY_DAYS = 28;

interface DatedPoint {
  date: string;
  value: number;
}

function dayStartIso(day: DayString): string {
  return `${day}T00:00:00.000Z`;
}

function dayEndIso(day: DayString): string {
  return `${day}T23:59:59.999Z`;
}

function pct(n: number | null): string {
  return n === null ? "Building" : `${n}%`;
}

async function fetchScores(userId: string, floor: DayString | null) {
  const supabase = await createClient();
  let q = supabase
    .from("v_daily_scores")
    .select("entry_date, score, score_health, score_identity, score_relationships, score_purpose")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true });
  if (floor) q = q.gte("entry_date", floor);
  const { data, error } = await q;
  if (error) throw new Error(`Could not load scores: ${error.message}`);
  return (data ?? []).map<DailyScoreRow>((r) => ({
    entryDate: r.entry_date,
    score: r.score ?? 0,
    health: r.score_health ?? 0,
    identity: r.score_identity ?? 0,
    relationships: r.score_relationships ?? 0,
    purpose: r.score_purpose ?? 0,
  }));
}

/** Scores for the trajectory window plus the period, whichever reaches further back. */
export async function loadTrajectory(window: PeriodWindow) {
  const profile = await requireProfile();
  const today = window.end;
  const trajectoryFloor = addDays(today, -(TRAJECTORY_DAYS - 1));
  const floor = window.start === null ? null : window.start < trajectoryFloor ? window.start : trajectoryFloor;
  const rows = await fetchScores(profile.user_id, floor);
  const trajectory = computeTrajectory(rows, today, TRAJECTORY_DAYS);
  const points: DatedPoint[] = rows
    .filter((r) => inWindow(r.entryDate, window.start, window.end))
    .map((r) => ({ date: r.entryDate, value: r.score }));
  return { trajectory, points };
}

export interface OverviewData {
  window: PeriodWindow;
  trajectory: Trajectory;
  points: DatedPoint[];
  pillars: { pillar: Pillar; label: string; percent: number | null }[];
  metrics: MetricRowData[];
  returnRate: ReturnRate;
  finishRatio90: FinishRatio;
  finishRatio30: FinishRatio;
}

export async function loadOverview(period: Period): Promise<OverviewData> {
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const window = periodWindow(period, today);
  const supabase = await createClient();
  const userId = profile.user_id;
  const floor = queryFloor(window);
  const ninetyStart = addDays(today, -89);
  const thirtyStart = addDays(today, -29);

  const [{ trajectory, points }, entries, occurrences, reps, commitments, history] = await Promise.all([
    loadTrajectory(window),
    (async () => {
      let q = supabase
        .from("daily_entries")
        .select("entry_date, published, evening_done_at")
        .eq("user_id", userId);
      if (window.start) q = q.gte("entry_date", window.start);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      let q = supabase.from("pattern_occurrences").select("occurred_on, response").eq("user_id", userId);
      if (floor) q = q.gte("occurred_on", floor);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      let q = supabase.from("courage_reps").select("occurred_on").eq("user_id", userId);
      if (floor) q = q.gte("occurred_on", floor);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      let q = supabase
        .from("daily_commitments")
        .select("entry_date, non_negotiable_id, completed")
        .eq("user_id", userId);
      if (window.start) q = q.gte("entry_date", window.start);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      const { data } = await supabase
        .from("project_status_history")
        .select("project_id, to_status, changed_at")
        .eq("user_id", userId)
        .gte("changed_at", dayStartIso(ninetyStart));
      return data ?? [];
    })(),
  ]);

  const words = periodWords(period);
  const metrics: MetricRowData[] = [];

  // Old pattern appearances: this period against the previous equal period.
  const inThis = (day: string) => inWindow(day, window.start, window.end);
  const inPrev = (day: string) => (window.previous ? inWindow(day, window.previous.start, window.previous.end) : false);
  const patternsNow = occurrences.filter((o) => inThis(o.occurred_on));
  const patternsThen = window.previous ? occurrences.filter((o) => inPrev(o.occurred_on)).length : null;
  const replacedNow = patternsNow.filter((o) => o.response === "replaced").length;
  const followedNow = patternsNow.length - replacedNow;
  metrics.push({
    key: "patterns",
    label: "Old pattern appearances",
    value: patternsThen === null ? String(patternsNow.length) : `${patternsThen} then, ${patternsNow.length} now`,
    word: patternsThen === null ? undefined : comparisonLine(patternsThen, patternsNow.length).split(", ").pop(),
    explain: {
      value: comparisonLine(patternsThen, patternsNow.length),
      inputs: [
        { label: `Appearances in ${words}`, value: String(patternsNow.length) },
        ...(window.previous
          ? [{ label: `Appearances in the ${window.days} days before`, value: String(patternsThen) }]
          : []),
        { label: "Met with the replacement", value: String(replacedNow) },
        { label: "Old response followed", value: String(followedNow) },
      ],
      arithmetic: window.previous
        ? [`${window.previous.start} to ${window.previous.end}: ${patternsThen}`, `${window.start} to ${window.end}: ${patternsNow.length}`]
        : [`All appearances logged: ${patternsNow.length}`],
      note: "An appearance is information, not a verdict. Fewer appearances and more replacements both count.",
    },
  });

  // Courage Reps: same comparison.
  const repsNow = reps.filter((r) => inThis(r.occurred_on)).length;
  const repsThen = window.previous ? reps.filter((r) => inPrev(r.occurred_on)).length : null;
  metrics.push({
    key: "courage",
    label: "Courage Reps",
    value: repsThen === null ? String(repsNow) : `${repsThen} then, ${repsNow} now`,
    word: repsThen === null ? undefined : comparisonLine(repsThen, repsNow).split(", ").pop(),
    explain: {
      value: comparisonLine(repsThen, repsNow),
      inputs: [
        { label: `Reps recorded in ${words}`, value: String(repsNow) },
        ...(window.previous ? [{ label: `Reps in the ${window.days} days before`, value: String(repsThen) }] : []),
      ],
      arithmetic: window.previous
        ? [`${window.previous.start} to ${window.previous.end}: ${repsThen}`, `${window.start} to ${window.end}: ${repsNow}`]
        : [`All reps recorded: ${repsNow}`],
      note: "Every rep is one logged act of action despite discomfort, from the action sheet or I'm Stuck.",
    },
  });

  // Return Rate over daily_commitments in the period.
  const returnRate = computeReturnRate(
    commitments.map((c) => ({ entryDate: c.entry_date, nonNegotiableId: c.non_negotiable_id, completed: c.completed })),
  );
  metrics.push({
    key: "return",
    label: "Return Rate",
    value: returnRate.value === null ? "Building" : `${returnRate.value}%`,
    word: returnRate.value === null ? plural(returnRate.misses, "miss", "misses") : undefined,
    explain: {
      value: returnRate.value === null ? `Building, ${plural(returnRate.misses, "miss", "misses")} so far` : `${returnRate.value}%`,
      inputs: [
        { label: `Misses in ${words}`, value: String(returnRate.misses) },
        { label: "Recovered the next day", value: String(returnRate.recoveries) },
      ],
      arithmetic: [
        returnRate.misses > 0
          ? `${returnRate.recoveries} recoveries divided by ${returnRate.misses} misses = ${Math.round((returnRate.recoveries / returnRate.misses) * 100)}%`
          : "No misses yet, so there is nothing to divide",
        "Shown once there are at least 3 misses",
      ],
      note: "A miss is a non-negotiable not completed on a day. A recovery is completing it the very next day. One miss is an event.",
    },
  });

  // Finish Ratio: ratio over 90 days, counts over 30.
  const changes = history.map((h) => ({
    projectId: h.project_id,
    toStatus: h.to_status,
    changedAt: new Date(h.changed_at).toISOString(),
  }));
  const finishRatio90 = computeFinishRatio(changes, dayStartIso(ninetyStart), dayEndIso(today));
  const finishRatio30 = computeFinishRatio(changes, dayStartIso(thirtyStart), dayEndIso(today), 0);
  metrics.push({
    key: "finish",
    label: "Finish Ratio",
    value: finishRatio90.ratio === null ? "Building" : `${Math.round(finishRatio90.ratio * 100)}%`,
    word:
      finishRatio90.ratio === null
        ? `${plural(finishRatio90.started, "start")} in 90 days`
        : `${finishRatio30.finished} finished, ${finishRatio30.started} started in 30 days`,
    explain: {
      value:
        finishRatio90.ratio === null
          ? `Building, ${plural(finishRatio90.started, "start")} in 90 days`
          : `${Math.round(finishRatio90.ratio * 100)}% over 90 days`,
      inputs: [
        { label: "Projects set to active in 90 days", value: String(finishRatio90.started) },
        { label: "Projects set to finished in 90 days", value: String(finishRatio90.finished) },
        { label: "Started in the last 30 days", value: String(finishRatio30.started) },
        { label: "Finished in the last 30 days", value: String(finishRatio30.finished) },
      ],
      arithmetic: [
        finishRatio90.started > 0
          ? `${finishRatio90.finished} finished divided by ${finishRatio90.started} started = ${Math.round((finishRatio90.finished / finishRatio90.started) * 100)}%`
          : "No projects started in the window, so there is nothing to divide",
        "The ratio is shown at 90 days once there are at least 3 starts. The 30-day counts are always shown.",
      ],
      note: "Counted from status changes, so a project started before the window and finished inside it counts as a finish.",
    },
  });

  // Visible days: published true out of logged days.
  const logged = entries.filter((e) => e.evening_done_at !== null);
  const visible = logged.filter((e) => e.published === true).length;
  metrics.push({
    key: "visible",
    label: "Visible days",
    value: `${visible} of ${logged.length}`,
    word: logged.length > 0 ? pct(percent(visible, logged.length)) : undefined,
    explain: {
      value: `${visible} of ${plural(logged.length, "logged day")}`,
      inputs: [
        { label: `Days with an evening check-in in ${words}`, value: String(logged.length) },
        { label: "Days you published or shipped something", value: String(visible) },
      ],
      arithmetic: [
        logged.length > 0
          ? `${visible} divided by ${logged.length} = ${percent(visible, logged.length)}%`
          : "No evening check-ins in this period yet",
      ],
    },
  });

  // Relationship and health consistency: 28-day mean of the pillar percent.
  const consistencyExplain = (pillar: Pillar): Explain => ({
    value: pct(trajectory.pillars[pillar]),
    inputs: [
      { label: "Days with an evening check-in in the last 28", value: String(trajectory.loggedDays) },
      { label: "Pillar weight", value: `${PILLAR_WEIGHTS[pillar]} points` },
    ],
    arithmetic: [
      `Each day: ${PILLAR_LABEL[pillar]} points divided by ${PILLAR_WEIGHTS[pillar]}`,
      `Mean across ${trajectory.loggedDays} logged days = ${pct(trajectory.pillars[pillar])}`,
      "Shown once there are at least 3 logged days",
    ],
    note: "Always a 28-day window, whatever period is selected above.",
  });
  metrics.push({
    key: "relationships",
    label: "Relationship consistency",
    value: pct(trajectory.pillars.relationships),
    word: "28 days",
    explain: consistencyExplain("relationships"),
  });
  metrics.push({
    key: "health",
    label: "Health consistency",
    value: pct(trajectory.pillars.health),
    word: "28 days",
    explain: consistencyExplain("health"),
  });

  const pillars = (Object.keys(PILLAR_WEIGHTS) as Pillar[]).map((p) => ({
    pillar: p,
    label: PILLAR_LABEL[p],
    percent: trajectory.pillars[p],
  }));

  return { window, trajectory, points, pillars, metrics, returnRate, finishRatio90, finishRatio30 };
}

export interface IdentityData {
  window: PeriodWindow;
  patterns: { id: number; name: string; total: number; followed: number; replaced: number }[];
  repsByType: { label: string; count: number }[];
  returnRate: ReturnRate;
  returnExplain: Explain;
  finishExplain: Explain;
  finishRatio90: FinishRatio;
  finishRatio30: FinishRatio;
}

export async function loadIdentity(period: Period): Promise<IdentityData> {
  const overview = await loadOverview(period);
  const profile = await requireProfile();
  const supabase = await createClient();
  const userId = profile.user_id;
  const { window } = overview;

  const [{ data: userPatterns }, { data: repTypes }, occurrences, reps] = await Promise.all([
    supabase.from("user_patterns").select("id, pattern_id").eq("user_id", userId).eq("in_focus", true),
    supabase.from("courage_rep_types").select("id, label"),
    (async () => {
      let q = supabase.from("pattern_occurrences").select("user_pattern_id, response, occurred_on").eq("user_id", userId);
      if (window.start) q = q.gte("occurred_on", window.start);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      let q = supabase.from("courage_reps").select("type_id, custom_label, occurred_on").eq("user_id", userId);
      if (window.start) q = q.gte("occurred_on", window.start);
      const { data } = await q;
      return data ?? [];
    })(),
  ]);

  const patternIds = (userPatterns ?? []).map((p) => p.pattern_id);
  const { data: library } =
    patternIds.length > 0
      ? await supabase.from("pattern_library").select("id, name").in("id", patternIds)
      : { data: [] as { id: number; name: string }[] };
  const nameByPattern = new Map((library ?? []).map((l) => [l.id, l.name]));

  const patterns = (userPatterns ?? []).map((up) => {
    const mine = occurrences.filter((o) => o.user_pattern_id === up.id);
    const replaced = mine.filter((o) => o.response === "replaced").length;
    return {
      id: up.id,
      name: nameByPattern.get(up.pattern_id) ?? "Pattern",
      total: mine.length,
      followed: mine.length - replaced,
      replaced,
    };
  });

  const typeLabel = new Map((repTypes ?? []).map((t) => [t.id, t.label]));
  const counts = new Map<string, number>();
  for (const r of reps) {
    const label = (r.type_id !== null ? typeLabel.get(r.type_id) : null) ?? r.custom_label ?? "Other";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const repsByType = [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  const find = (key: string) => overview.metrics.find((m) => m.key === key)!.explain;

  return {
    window,
    patterns,
    repsByType,
    returnRate: overview.returnRate,
    returnExplain: find("return"),
    finishExplain: find("finish"),
    finishRatio90: overview.finishRatio90,
    finishRatio30: overview.finishRatio30,
  };
}

export interface RelationshipsProgressData {
  window: PeriodWindow;
  today: DayString;
  people: {
    id: number;
    name: string;
    groupLabel: string;
    cadenceDays: number;
    lastOn: DayString | null;
    countInPeriod: number;
    isPartner: boolean;
  }[];
  partnerRatings: DatedPoint[];
  weeklyQuestion: string;
}

export const WEEKLY_QUESTION =
  "Did the people I love feel important to me this week, or merely know that they're important?";

export async function loadRelationshipsProgress(period: Period): Promise<RelationshipsProgressData> {
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const window = periodWindow(period, today);
  const supabase = await createClient();
  const userId = profile.user_id;

  const [{ data: groups }, { data: people }, { data: interactions }] = await Promise.all([
    supabase.from("people_groups").select("id, key, label, sort_order").eq("user_id", userId),
    supabase.from("people").select("id, name, group_id, cadence_days").eq("user_id", userId).eq("is_active", true),
    supabase
      .from("interactions")
      .select("person_id, occurred_on, kind, connection_rating")
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false })
      .limit(2000),
  ]);

  const groupById = new Map((groups ?? []).map((g) => [g.id, g]));
  const rows = interactions ?? [];

  const peopleOut = (people ?? [])
    .map((p) => {
      const group = groupById.get(p.group_id);
      const mine = rows.filter((i) => i.person_id === p.id);
      return {
        id: p.id,
        name: p.name,
        groupLabel: group?.label ?? "",
        groupOrder: group?.sort_order ?? 99,
        cadenceDays: p.cadence_days,
        lastOn: mine[0]?.occurred_on ?? null,
        countInPeriod: mine.filter((i) => inWindow(i.occurred_on, window.start, window.end)).length,
        isPartner: group?.key === "partner",
      };
    })
    .sort((a, b) => a.groupOrder - b.groupOrder || a.name.localeCompare(b.name));

  const partnerIds = new Set(peopleOut.filter((p) => p.isPartner).map((p) => p.id));
  const partnerRatings = rows
    .filter((i) => partnerIds.has(i.person_id) && i.connection_rating !== null && inWindow(i.occurred_on, window.start, window.end))
    .map((i) => ({ date: i.occurred_on, value: i.connection_rating as number }))
    .reverse();

  return { window, today, people: peopleOut, partnerRatings, weeklyQuestion: WEEKLY_QUESTION };
}

export type { InteractionKind };
export { weekStart };
