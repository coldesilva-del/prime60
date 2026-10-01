import { daysBetween, type DayString } from "@/lib/dates";
import type { InteractionKind } from "@/lib/supabase/types";

/** Cadence in plain words. Custom values read as "Every N days". */
export function cadenceWords(cadenceDays: number): string {
  switch (cadenceDays) {
    case 1:
      return "Daily";
    case 7:
      return "Weekly";
    case 14:
      return "Fortnightly";
    case 30:
      return "Monthly";
    default:
      return `Every ${cadenceDays} days`;
  }
}

export const CADENCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Daily" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Fortnightly" },
  { value: 30, label: "Monthly" },
];

/** Days since the last interaction, or null when there has never been one. */
export function daysSince(lastOn: DayString | null, today: DayString): number | null {
  if (!lastOn) return null;
  return Math.max(0, daysBetween(lastOn, today));
}

/**
 * Drift: the cadence has lapsed by more than one period, meaning the days
 * since the last interaction exceed twice the cadence. Never "overdue".
 */
export function isDrifting(lastOn: DayString | null, cadenceDays: number, today: DayString): boolean {
  const since = daysSince(lastOn, today);
  if (since === null) return false;
  return since > cadenceDays * 2;
}

export function driftNote(name: string): string {
  return `It has been a while since you and ${name} connected`;
}

/** "Today", "Yesterday", "3 days ago", or "No interactions yet". */
export function sinceWords(lastOn: DayString | null, today: DayString): string {
  const since = daysSince(lastOn, today);
  if (since === null) return "No interactions yet";
  if (since === 0) return "Today";
  if (since === 1) return "Yesterday";
  return `${since} days ago`;
}

export const INTERACTION_LABEL: Record<InteractionKind, string> = {
  contact: "Meaningful contact",
  quality_time: "Quality time",
  support: "Support",
  conversation: "Important conversation",
  gratitude: "Gratitude",
  note: "Note",
};

export const INTERACTION_KINDS: InteractionKind[] = [
  "contact",
  "quality_time",
  "support",
  "conversation",
  "gratitude",
  "note",
];
