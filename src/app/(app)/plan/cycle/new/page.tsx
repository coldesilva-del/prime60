import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StartCycleForm } from "@/components/cycle/start-cycle-form";
import { Group, Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { carryForward, PILLAR_LABELS } from "@/lib/cycles/dates";
import { getActiveCycle, getCycle, getCycleObjectives } from "@/lib/cycles/queries";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Start a cycle" };

export default async function NewCyclePage(props: PageProps<"/plan/cycle/new">) {
  const { from } = await props.searchParams;
  const profile = await requireProfile();
  const db = await createClient();

  if (await getActiveCycle(db, profile.user_id)) redirect("/plan/cycle");

  const fromId = typeof from === "string" && /^\d+$/.test(from) ? Number(from) : null;
  const previous = fromId ? await getCycle(db, profile.user_id, fromId) : null;
  const carried = previous ? carryForward(await getCycleObjectives(db, profile.user_id, previous.id)) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={previous ? "Start the next cycle" : "Start a cycle"}
        backHref="/plan/cycle"
        description="Ninety days. Up to six objectives. One decision per objective at the end."
      />

      {previous ? (
        <Section
          title="Carrying forward"
          description={
            carried.length
              ? "Objectives you chose to continue or scale. Status resets; write a fresh starting point and next action."
              : "Nothing carries forward from the last cycle. Start clean."
          }
        >
          {carried.length ? (
            <Group>
              {carried.map((o, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-sm text-ink-soft">{PILLAR_LABELS[o.pillar]}</p>
                  <p className="text-base text-ink">{o.outcome}</p>
                </div>
              ))}
            </Group>
          ) : null}
        </Section>
      ) : null}

      <StartCycleForm
        defaultStartsOn={todayIn(profile.timezone)}
        fromCycleId={previous?.id ?? null}
        carriedCount={carried.length}
      />
    </div>
  );
}
