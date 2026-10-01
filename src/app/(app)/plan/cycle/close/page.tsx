import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CloseCycleForm } from "@/components/cycle/close-cycle-form";
import { PageHeader } from "@/components/layout/page-header";
import { getActiveCycleWithObjectives } from "@/lib/cycles/queries";
import { formatDayShort } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Close the cycle" };

export default async function CloseCyclePage() {
  const profile = await requireProfile();
  const db = await createClient();
  const active = await getActiveCycleWithObjectives(db, profile.user_id);
  if (!active) redirect("/plan/cycle");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Close the cycle"
        backHref="/plan/cycle"
        eyebrow={`${formatDayShort(active.cycle.starts_on)} to ${formatDayShort(active.cycle.ends_on)}`}
        description="One decision per objective: Continue, Adapt, Stop or Scale. Continue and Scale carry into the next cycle."
      />
      <CloseCycleForm objectives={active.objectives} />
    </div>
  );
}
