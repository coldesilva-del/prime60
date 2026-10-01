import { addDays, type DayString } from "@/lib/dates";

/** Progress periods. "all" means no lower bound. */
export type Period = 7 | 30 | 90 | 365 | "all";

export const PERIODS: Period[] = [7, 30, 90, 365, "all"];

export const DEFAULT_PERIOD: Period = 30;

export function parsePeriod(raw: string | string[] | undefined): Period {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "all") return "all";
  const n = Number(value);
  if (n === 7 || n === 30 || n === 90 || n === 365) return n;
  return DEFAULT_PERIOD;
}

export function periodLabel(period: Period): string {
  return period === "all" ? "All" : String(period);
}

/** Sentence fragment for captions: "the last 30 days" or "all time". */
export function periodWords(period: Period): string {
  return period === "all" ? "all time" : `the last ${period} days`;
}

export interface PeriodWindow {
  period: Period;
  /** First day in the window, or null for all time. */
  start: DayString | null;
  /** Last day in the window (today). */
  end: DayString;
  /** Number of days, or null for all time. */
  days: number | null;
  /** The equal-length period immediately before, or null for all time. */
  previous: { start: DayString; end: DayString } | null;
}

/** Inclusive day window ending today, plus the equal window before it. */
export function periodWindow(period: Period, today: DayString): PeriodWindow {
  if (period === "all") {
    return { period, start: null, end: today, days: null, previous: null };
  }
  const start = addDays(today, -(period - 1));
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(period - 1));
  return { period, start, end: today, days: period, previous: { start: prevStart, end: prevEnd } };
}

export function inWindow(day: DayString, start: DayString | null, end: DayString): boolean {
  return (start === null || day >= start) && day <= end;
}

/** Lower bound for a query that must cover both this period and the previous one. */
export function queryFloor(window: PeriodWindow): DayString | null {
  return window.previous ? window.previous.start : window.start;
}
