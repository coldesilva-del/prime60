import type { Metadata } from "next";
import { BarRow } from "@/components/charts/bar-row";
import { LineChart } from "@/components/charts/line-chart";
import { Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { MetricList } from "@/components/progress/metric-list";
import { PeriodSelector } from "@/components/progress/period-selector";
import { ProgressNav } from "@/components/progress/progress-nav";
import { TrajectoryBlock } from "@/components/progress/trajectory-block";
import { plural } from "@/lib/progress/metrics";
import { parsePeriod, periodWords } from "@/lib/progress/periods";
import { loadOverview } from "@/lib/progress/queries";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const data = await loadOverview(period);
  const { trajectory, points, pillars, metrics } = data;
  const words = periodWords(period);

  const latest = points[points.length - 1];
  const scoreSummary =
    points.length === 0
      ? `No evening check-ins in ${words} yet.`
      : `Prime Score over ${words}: ${plural(points.length, "logged day")}, from ${points[0].value} to ${latest.value}, latest ${latest.value} on ${latest.date}.`;

  return (
    <div className="space-y-8">
      <PageHeader title="Progress" description="Where am I?" />
      <ProgressNav />
      <PeriodSelector basePath="/progress" period={period} />

      <Section title="Prime Trajectory">
        <TrajectoryBlock trajectory={trajectory} />
        <LineChart title={`Prime Score over ${words}`} points={points} include={[0, 100]} summary={scoreSummary} />
      </Section>

      <Section title="Pillar consistency" description="Mean pillar percent over the last 28 logged days.">
        <div className="space-y-4">
          {pillars.map((p) => (
            <BarRow key={p.pillar} label={p.label} value={p.percent === null ? "Building" : `${p.percent}%`} percent={p.percent} />
          ))}
        </div>
      </Section>

      <Section title="The numbers" description="Tap a number to see the inputs and the arithmetic.">
        <MetricList rows={metrics} />
      </Section>
    </div>
  );
}
