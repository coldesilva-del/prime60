import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapRow } from "@/components/cycle/roadmap-row";
import { PageHeader } from "@/components/layout/page-header";
import { PlanNav } from "@/components/plan/plan-nav";
import { getActiveCycleWithObjectives } from "@/lib/cycles/queries";
import { getNorthStarSummaries, getRoadmapItems, getTodayOneThing } from "@/lib/cycles/roadmap";
import { HORIZON_LABELS } from "@/lib/cycles/schemas";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const profile = await requireProfile();
  const db = await createClient();
  const today = todayIn(profile.timezone);
  const userId = profile.user_id;

  const [oneThing, active, items, stars] = await Promise.all([
    getTodayOneThing(db, userId, today),
    getActiveCycleWithObjectives(db, userId),
    getRoadmapItems(db, userId),
    getNorthStarSummaries(db, userId),
  ]);

  const objectives = active?.objectives ?? [];
  const todayLine = oneThing ?? objectives.find((o) => o.next_action)?.next_action ?? null;
  const targetYear = profile.target_year ?? Number(today.slice(0, 4)) + 5;

  return (
    <div className="space-y-6">
      <PlanNav />
      <PageHeader title="Roadmap" description="From today to your Prime Self, in your own words." />

      <ol className="relative">
        <span aria-hidden className="absolute bottom-6 left-[107px] top-6 w-px bg-hairline" />

        <Row label="Today">
          {todayLine ? (
            <p className="font-display text-lg text-ink">{todayLine}</p>
          ) : (
            <p className="text-base text-ink-soft">
              No one thing set.{" "}
              <Link href="/today" className="font-medium text-harbour">
                Start the morning
              </Link>
            </p>
          )}
          {oneThing === null && todayLine ? <p className="text-sm text-ink-soft">Next action from the cycle.</p> : null}
        </Row>

        <Row label="90 days">
          {objectives.length ? (
            <ul className="space-y-2">
              {objectives.map((o) => (
                <li key={o.id}>
                  <Link href={`/plan/cycle/objectives/${o.id}`} className="block text-base text-ink">
                    {o.outcome}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-ink-soft">
              No cycle running.{" "}
              <Link href="/plan/cycle/new" className="font-medium text-harbour">
                Start a cycle
              </Link>
            </p>
          )}
        </Row>

        <Row label={HORIZON_LABELS["1y"]}>
          <RoadmapRow horizon="1y" items={items["1y"]} />
        </Row>

        <Row label={HORIZON_LABELS["3y"]}>
          <RoadmapRow horizon="3y" items={items["3y"]} />
        </Row>

        <Row label={`${HORIZON_LABELS["5y"]}, ${targetYear}`}>
          {stars.length ? (
            <ul className="space-y-1">
              {stars.map((s) => (
                <li key={s.section} className="font-display text-lg text-ink">
                  {s.line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-ink-soft">
              Your North Star is empty.{" "}
              <Link href="/vision/edit" className="font-medium text-harbour">
                Write it
              </Link>
            </p>
          )}
          <RoadmapRow horizon="5y" items={items["5y"]} />
        </Row>
      </ol>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[88px_16px_minmax(0,1fr)] gap-x-3 py-5">
      <span className="pt-0.5 text-sm font-medium text-ink-soft">{label}</span>
      <span aria-hidden className="mt-1.5 size-2.5 justify-self-center rounded-full bg-harbour ring-4 ring-paper" />
      <div className="space-y-3">{children}</div>
    </li>
  );
}
