import type { Metadata } from "next";
import { BarRow } from "@/components/charts/bar-row";
import { EmptyState, Group, Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { ExplainNumber } from "@/components/progress/explain-sheet";
import { PeriodSelector } from "@/components/progress/period-selector";
import { ProgressNav } from "@/components/progress/progress-nav";
import { plural } from "@/lib/progress/metrics";
import { parsePeriod, periodWords } from "@/lib/progress/periods";
import { loadIdentity } from "@/lib/progress/queries";

export const metadata: Metadata = { title: "Identity progress" };

export default async function IdentityProgressPage({ searchParams }: PageProps<"/progress/identity">) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const data = await loadIdentity(period);
  const words = periodWords(period);

  const maxPattern = Math.max(1, ...data.patterns.map((p) => p.total));
  const maxRep = Math.max(1, ...data.repsByType.map((r) => r.count));
  const totalReps = data.repsByType.reduce((a, r) => a + r.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Identity" description="Old patterns down, Courage Reps up, things finished." />
      <ProgressNav />
      <PeriodSelector basePath="/progress/identity" period={period} />

      <Section title="Old pattern appearances" description={`Per pattern in focus, over ${words}. Each bar is replaced plus followed.`}>
        {data.patterns.length === 0 ? (
          <EmptyState>Choose up to five patterns to keep in focus and their appearances will show here.</EmptyState>
        ) : (
          <div className="space-y-4">
            {data.patterns.map((p) => (
              <BarRow
                key={p.id}
                label={p.name}
                value={String(p.total)}
                percent={Math.round((p.total / maxPattern) * 100)}
                summary={
                  p.total === 0
                    ? "No appearances"
                    : `${p.replaced} met with the replacement, ${p.followed} followed the old response`
                }
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Courage Reps by type" description={`${plural(totalReps, "rep")} over ${words}.`}>
        {data.repsByType.length === 0 ? (
          <EmptyState>Record a Courage Rep from the action sheet and it will show here.</EmptyState>
        ) : (
          <div className="space-y-4">
            {data.repsByType.map((r) => (
              <BarRow key={r.label} label={r.label} value={String(r.count)} percent={Math.round((r.count / maxRep) * 100)} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Finishing and returning">
        <Group>
          <ExplainNumber
            label="Finish Ratio"
            value={data.finishRatio90.ratio === null ? "Building" : `${Math.round(data.finishRatio90.ratio * 100)}%`}
            word={`${data.finishRatio30.finished} finished, ${data.finishRatio30.started} started in 30 days`}
            explain={data.finishExplain}
          />
          <ExplainNumber
            label="Return Rate"
            value={data.returnRate.value === null ? "Building" : `${data.returnRate.value}%`}
            word={`${plural(data.returnRate.recoveries, "recovery", "recoveries")} from ${plural(data.returnRate.misses, "miss", "misses")}`}
            explain={data.returnExplain}
          />
        </Group>
      </Section>
    </div>
  );
}
