/**
 * Date helpers. All "day" values are YYYY-MM-DD strings in the user's timezone.
 * Never use `new Date().toISOString().slice(0,10)` for a user-facing day; it is UTC.
 */

export type DayString = string;

const ymd = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string) {
  let f = ymd.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    ymd.set(timeZone, f);
  }
  return f;
}

/** Today's date in the given IANA timezone. */
export function todayIn(timeZone: string, now: Date = new Date()): DayString {
  return formatter(timeZone).format(now);
}

/** Hour of day (0 to 23) in the given timezone. */
export function hourIn(timeZone: string, now: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(now);
  return Number(h) % 24;
}

/** Day of week, 0 Sunday to 6 Saturday, in the given timezone. */
export function dayOfWeekIn(timeZone: string, now: Date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export function addDays(day: DayString, delta: number): DayString {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b. */
export function daysBetween(a: DayString, b: DayString): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400000);
}

/** Monday that starts the week containing `day`. */
export function weekStart(day: DayString): DayString {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  const dow = d.getUTCDay(); // 0 Sunday
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(day, -back);
}

/** "Wed 1 October" style label for a day string. */
export function formatDayLong(day: DayString, locale = "en-AU"): string {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }).format(d);
}

/** "1 Oct" style short label. */
export function formatDayShort(day: DayString, locale = "en-AU"): string {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
