import { todayIn, weekStart, type DayString } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { periodWindow, type Period, type PeriodWindow } from "@/lib/progress/periods";
import { createClient } from "@/lib/supabase/server";
import type { HealthMetricRow, HealthTargetsRow } from "@/lib/supabase/types";

export const EMPTY_TARGETS: Omit<HealthTargetsRow, "user_id" | "updated_at"> = {
  starting_weight: null,
  starting_body_fat: null,
  target_weight: null,
  target_body_fat_low: null,
  target_body_fat_high: null,
  resistance_per_week: null,
  cardio_per_week: null,
  cardio_calories_per_session: null,
  steps_per_day: null,
  hidden_fields: [],
};

export async function getHealthTargets(): Promise<Omit<HealthTargetsRow, "user_id" | "updated_at">> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("health_targets").select("*").eq("user_id", profile.user_id).maybeSingle();
  return data ?? EMPTY_TARGETS;
}

export async function getMetricForDate(date: DayString): Promise<HealthMetricRow | null> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("metric_date", date)
    .maybeSingle();
  return data ?? null;
}

export interface HealthProgressData {
  window: PeriodWindow;
  today: DayString;
  mode: "track" | "coached";
  targets: Omit<HealthTargetsRow, "user_id" | "updated_at">;
  metrics: Pick<HealthMetricRow, "metric_date" | "weight" | "body_fat" | "waist" | "steps">[];
  /** The latest logged weight and body fat, from any date (not only the window). */
  latest: { weight: number | null; weightOn: DayString | null; bodyFat: number | null; bodyFatOn: DayString | null };
  entries: { entry_date: DayString; energy: number | null; trained: boolean | null }[];
  trainedThisWeek: number;
  weekStartDay: DayString;
}

export async function loadHealthProgress(period: Period): Promise<HealthProgressData> {
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const window = periodWindow(period, today);
  const supabase = await createClient();
  const userId = profile.user_id;
  const weekStartDay = weekStart(today);

  const [targets, metrics, latestWeight, latestFat, entries, week] = await Promise.all([
    getHealthTargets(),
    (async () => {
      let q = supabase
        .from("health_metrics")
        .select("metric_date, weight, body_fat, waist, steps")
        .eq("user_id", userId)
        .order("metric_date", { ascending: true });
      if (window.start) q = q.gte("metric_date", window.start);
      const { data } = await q;
      return data ?? [];
    })(),
    supabase
      .from("health_metrics")
      .select("metric_date, weight")
      .eq("user_id", userId)
      .not("weight", "is", null)
      .order("metric_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("health_metrics")
      .select("metric_date, body_fat")
      .eq("user_id", userId)
      .not("body_fat", "is", null)
      .order("metric_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (async () => {
      let q = supabase
        .from("daily_entries")
        .select("entry_date, energy, trained")
        .eq("user_id", userId)
        .not("evening_done_at", "is", null)
        .order("entry_date", { ascending: true });
      if (window.start) q = q.gte("entry_date", window.start);
      const { data } = await q;
      return data ?? [];
    })(),
    supabase
      .from("daily_entries")
      .select("entry_date")
      .eq("user_id", userId)
      .eq("trained", true)
      .gte("entry_date", weekStartDay)
      .lte("entry_date", today),
  ]);

  return {
    window,
    today,
    mode: profile.health_mode,
    targets,
    metrics,
    latest: {
      weight: latestWeight.data?.weight ?? null,
      weightOn: latestWeight.data?.metric_date ?? null,
      bodyFat: latestFat.data?.body_fat ?? null,
      bodyFatOn: latestFat.data?.metric_date ?? null,
    },
    entries,
    trainedThisWeek: week.data?.length ?? 0,
    weekStartDay,
  };
}
