/**
 * Pure scale maths for the SVG charts. Plots use a 0..100 coordinate space in
 * both axes so the SVG can stretch to its container; strokes are kept at a
 * fixed pixel width with vector-effect so nothing distorts.
 */

export interface Domain {
  min: number;
  max: number;
  ticks: number[];
}

/** A "nice" step (1, 2, 2.5, 5 times a power of ten) near the raw step. */
export function niceStep(raw: number): number {
  if (raw <= 0 || !Number.isFinite(raw)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  let nice: number;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 2.5) nice = 2.5;
  else if (fraction <= 5) nice = 5;
  else nice = 10;
  return nice * power;
}

/**
 * Domain that covers every value (and any reference lines) with rounded
 * gridline ticks. Never inverts: the axis always rises.
 */
export function niceDomain(values: number[], maxTicks = 4): Domain {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { min: 0, max: 100, ticks: [0, 50, 100] };
  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.05 || 1;
    lo -= pad;
    hi += pad;
  }
  const step = niceStep((hi - lo) / Math.max(1, maxTicks - 1));
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max + step / 1000; t += step) ticks.push(round(t));
  return { min: round(min), max: round(max), ticks };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Position of a value on the 0..100 vertical axis, 0 at the top. */
export function yPos(value: number, domain: Domain): number {
  if (domain.max === domain.min) return 50;
  const t = (value - domain.min) / (domain.max - domain.min);
  return round(100 - t * 100);
}

/** Whole days from a to b for YYYY-MM-DD strings. */
function dayDiff(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400000);
}

export interface DatedPoint {
  date: string;
  value: number;
}

/** Points placed proportionally by date across 0..100; one point sits in the middle. */
export function positionPoints(points: DatedPoint[], domain: Domain): { x: number; y: number; date: string; value: number }[] {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (sorted.length === 0) return [];
  const first = sorted[0].date;
  const span = dayDiff(first, sorted[sorted.length - 1].date);
  return sorted.map((p) => ({
    x: span === 0 ? 50 : round((dayDiff(first, p.date) / span) * 100),
    y: yPos(p.value, domain),
    date: p.date,
    value: p.value,
  }));
}

export function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
}

/** Formats a chart value compactly: 72, 72.5, 1,200. */
export function formatTick(n: number): string {
  const abs = Math.abs(n);
  const decimals = abs >= 100 || Number.isInteger(n) ? 0 : 1;
  return n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}
