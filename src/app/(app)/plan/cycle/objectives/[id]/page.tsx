import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DeleteObjectiveButton } from "@/components/cycle/delete-objective-button";
import { ObjectiveForm } from "@/components/cycle/objective-form";
import { PageHeader } from "@/components/layout/page-header";
import { countByPillar } from "@/lib/cycles/dates";
import { getActiveCycleWithObjectives, getObjective } from "@/lib/cycles/queries";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Objective" };

export default async function ObjectivePage(props: PageProps<"/plan/cycle/objectives/[id]">) {
  const { id } = await props.params;
  const profile = await requireProfile();
  const db = await createClient();

  const active = await getActiveCycleWithObjectives(db, profile.user_id);

  if (id === "new") {
    if (!active) redirect("/plan/cycle");
    return (
      <div className="space-y-8">
        <PageHeader title="New objective" backHref="/plan/cycle" description="One outcome, in one line, that will be true in 90 days." />
        <ObjectiveForm objective={null} counts={countByPillar(active.objectives)} total={active.objectives.length} />
      </div>
    );
  }

  if (!/^\d+$/.test(id)) notFound();
  const objective = await getObjective(db, profile.user_id, Number(id));
  if (!objective) notFound();

  const siblings = active && active.cycle.id === objective.cycle_id ? active.objectives : [objective];

  return (
    <div className="space-y-8">
      <PageHeader title="Objective" backHref="/plan/cycle" />
      <ObjectiveForm objective={objective} counts={countByPillar(siblings)} total={siblings.length} />
      <div className="flex justify-center">
        <DeleteObjectiveButton objectiveId={objective.id} />
      </div>
    </div>
  );
}
