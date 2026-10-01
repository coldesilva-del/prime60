import type { Metadata } from "next";
import { HealthLogForm } from "@/components/health/health-log-form";
import { WeighInForm } from "@/components/health/weigh-in-form";
import { PageHeader } from "@/components/layout/page-header";
import { todayIn } from "@/lib/dates";
import { getHealthTargets, getMetricForDate } from "@/lib/health/queries";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Log health" };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function HealthLogPage({ searchParams }: PageProps<"/progress/health/log">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const today = todayIn(profile.timezone);
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const date = raw && DAY.test(raw) && raw <= today ? raw : today;

  const [targets, existing] = await Promise.all([getHealthTargets(), getMetricForDate(date)]);

  if (profile.health_mode === "coached") {
    return (
      <div className="space-y-6">
        <PageHeader title="Weekly weigh-in" backHref="/progress/health" />
        <WeighInForm date={date} today={today} initial={{ weight: existing?.weight ?? null, body_fat: existing?.body_fat ?? null }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Log health" backHref="/progress/health" description="Every field is optional." />
      <HealthLogForm date={date} today={today} hiddenFields={targets.hidden_fields} initial={existing} />
    </div>
  );
}
