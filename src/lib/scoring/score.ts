/**
 * Prime Score. See docs/01-prd.md section 7.
 * Pure functions, no I/O. Weights sum to 100.
 */

export type Pillar = "health" | "identity" | "relationships" | "purpose";

export type ScoreKey = "h1" | "h2" | "i1" | "i2" | "i3" | "r1" | "r2" | "p1" | "p2" | "p3";

export const PILLAR_WEIGHTS: Record<Pillar, number> = {
  health: 30,
  identity: 30,
  relationships: 20,
  purpose: 20,
};

export const ITEM_WEIGHTS: Record<ScoreKey, number> = {
  h1: 15,
  h2: 7,
  h3: 8,
  i1: 12,
  i2: 8,
  i3: 10,
  r1: 12,
  r2: 8,
  p1: 10,
  p2: 6,
  p3: 4,
} as Record<ScoreKey, number> & { h3: number };

export const ITEM_PILLAR: Record<ScoreKey | "h3", Pillar> = {
  h1: "health",
  h2: "health",
  h3: "health",
  i1: "identity",
  i2: "identity",
  i3: "identity",
  r1: "relationships",
  r2: "relationships",
  p1: "purpose",
  p2: "purpose",
  p3: "purpose",
};

export const ITEM_LABELS: Record<ScoreKey | "h3", string> = {
  h1: "Trained",
  h2: "Moved or logged with coach",
  h3: "Energy",
  i1: "Finished the one thing",
  i2: "Courage Rep",
  i3: "Old patterns handled",
  r1: "Connected",
  r2: "Quality time",
  p1: "Published or shipped",
  p2: "Moved the main project",
  p3: "Served someone",
};

export interface EveningInputs {
  healthMode: "track" | "coached";
  trained: boolean | null;
  moved: boolean | null;
  loggedWithCoach: boolean | null;
  energy: number | null;
  finishedOneThing: boolean | null;
  courageRepToday: boolean;
  /** Pattern appearances today: counts by response. */
  patternsFollowed: number;
  patternsReplaced: number;
  connected: boolean | null;
  qualityTime: boolean | null;
  published: boolean | null;
  movedProject: boolean | null;
  served: boolean | null;
}

export interface BreakdownItem {
  key: ScoreKey | "h3";
  label: string;
  pillar: Pillar;
  points: number;
  max: number;
  /** Short reason shown in "Why this score". */
  reason: string;
}

export interface ScoreResult {
  score: number;
  pillars: Record<Pillar, number>;
  pillarPercent: Record<Pillar, number>;
  breakdown: BreakdownItem[];
}

function yesNo(value: boolean | null, max: number, label: string): [number, string] {
  if (value === true) return [max, `${label}: yes`];
  if (value === false) return [0, `${label}: no`];
  return [0, `${label}: not recorded`];
}

export function energyPoints(energy: number | null): number {
  if (energy == null) return 0;
  const clamped = Math.min(10, Math.max(1, Math.round(energy)));
  return Math.round(clamped * 0.8);
}

export function patternPoints(followed: number, replaced: number): [number, string] {
  const total = followed + replaced;
  if (total === 0) return [10, "No old pattern appeared"];
  if (followed === 0) return [10, `${replaced} appearance${replaced === 1 ? "" : "s"}, every one met with the replacement`];
  if (replaced === 0) return [0, `${followed} appearance${followed === 1 ? "" : "s"}, old response followed`];
  return [5, `${total} appearances, ${replaced} replaced, ${followed} followed`];
}

export function computeScore(input: EveningInputs): ScoreResult {
  const items: BreakdownItem[] = [];

  const push = (key: ScoreKey | "h3", points: number, reason: string) => {
    items.push({
      key,
      label: ITEM_LABELS[key],
      pillar: ITEM_PILLAR[key],
      points,
      max: ITEM_WEIGHTS[key as ScoreKey],
      reason,
    });
  };

  const [h1, h1r] = yesNo(input.trained, 15, "Trained");
  push("h1", h1, h1r);

  if (input.healthMode === "coached") {
    const [h2, h2r] = yesNo(input.loggedWithCoach, 7, "Logged with coach");
    push("h2", h2, h2r);
  } else {
    const [h2, h2r] = yesNo(input.moved, 7, "Moved");
    push("h2", h2, h2r);
  }

  const e = energyPoints(input.energy);
  push("h3", e, input.energy == null ? "Energy: not recorded" : `Energy ${input.energy} of 10`);

  const [i1, i1r] = yesNo(input.finishedOneThing, 12, "Finished the one thing");
  push("i1", i1, i1r);
  push("i2", input.courageRepToday ? 8 : 0, input.courageRepToday ? "Courage Rep recorded" : "No Courage Rep today");
  const [i3, i3r] = patternPoints(input.patternsFollowed, input.patternsReplaced);
  push("i3", i3, i3r);

  const [r1, r1r] = yesNo(input.connected, 12, "Connected");
  push("r1", r1, r1r);
  const [r2, r2r] = yesNo(input.qualityTime, 8, "Quality time");
  push("r2", r2, r2r);

  const [p1, p1r] = yesNo(input.published, 10, "Published");
  push("p1", p1, p1r);
  const [p2, p2r] = yesNo(input.movedProject, 6, "Moved the main project");
  push("p2", p2, p2r);
  const [p3, p3r] = yesNo(input.served, 4, "Served someone");
  push("p3", p3, p3r);

  const pillars: Record<Pillar, number> = { health: 0, identity: 0, relationships: 0, purpose: 0 };
  for (const item of items) pillars[item.pillar] += item.points;

  const pillarPercent = Object.fromEntries(
    (Object.keys(pillars) as Pillar[]).map((p) => [p, Math.round((pillars[p] / PILLAR_WEIGHTS[p]) * 100)]),
  ) as Record<Pillar, number>;

  const score = Object.values(pillars).reduce((a, b) => a + b, 0);
  return { score, pillars, pillarPercent, breakdown: items };
}

export function scoreBand(score: number): "90" | "70" | "50" | "0" {
  if (score >= 85) return "90";
  if (score >= 70) return "70";
  if (score >= 50) return "50";
  return "0";
}
