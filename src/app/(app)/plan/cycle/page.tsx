import type { Metadata } from "next";
import Link from "next/link";
import { CycleProgress } from "@/components/cycle/cycle-progress";
import { ObjectiveList } from "@/components/cycle/objective-list";
import { EmptyState, Hairline } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { PlanNav } from "@/components/plan/plan-nav";
import { Button } from "@/components/ui/button";
import { carryForward, MAX_OBJECTIVES } from "@/lib/cycles/dates";
import { getActiveCycleWithObjectives, getCycleObjectives, getLatestClosedCycle } from "@/lib/cycles/queries";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "90-day cycle" };

export default async function CyclePage() {
  const profile = await requireProfile();
  const db = await createClient();
  const today = todayIn(profile.timezone);
  const active = await getActiveCycleWithObjectives(db, profile.user_id);

  if (!active) {
    const closed = await getLatestClosedCycle(db, profile.user_id);
    const carried = closed ? carryForward(await getCycleObjectives(db, profile.user_id, closed.id)).length : 0;
    return (
      <div className="space-y-6">
        <PlanNav />
        <PageHeader title="90-day cycle" description="Up to six objectives, one per thing that matters, for the next 90 days." />
        <EmptyState
          action={
            <div className="flex flex-col gap-3">
              {closed && carried > 0 ? (
                <Button render={<Link href={`/plan/cycle/new?from=${closed.id}`} />}>
                  Start the next cycle
                </Button>
              ) : null}
              <Button variant={closed && carried > 0 ? "secondary" : "default"} render={<Link href="/plan/cycle/new" />}>
                Start a cycle
              </Button>
            </div>
          }
        >
          {closed && carried > 0
            ? `No cycle is running. ${carried} ${carried === 1 ? "objective" : "objectives"} from the last one can carry forward.`
            : "No cycle is running."}
        </EmptyState>
      </div>
    );
  }

  const { cycle, objectives } = active;
  const atLimit = objectives.length >= MAX_OBJECTIVES;

  return (
    <div className="space-y-8">
      <PlanNav />
      <PageHeader
        title="90-day cycle"
        action={
          <Link href="/plan/cycle/close" className="inline-flex h-11 items-center text-sm font-medium text-harbour">
            Close cycle
          </Link>
        }
      />
      <CycleProgress startsOn={cycle.starts_on} endsOn={cycle.ends_on} today={today} />
      <Hairline />
      {objectives.length ? (
        <ObjectiveList objectives={objectives} />
      ) : (
        <EmptyState>No objectives yet. One or two for Health and Purpose, one each for Relationships and Identity.</EmptyState>
      )}
      {atLimit ? (
        <p className="text-sm text-ink-soft">Six objectives is the limit. Finish or stop one to make room.</p>
      ) : (
        <Button variant="secondary" size="full" render={<Link href="/plan/cycle/objectives/new" />}>
          Add objective
        </Button>
      )}
    </div>
  );
}
