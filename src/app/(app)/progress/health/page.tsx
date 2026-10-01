import type { Metadata } from "next";
import Link from "next/link";
import { BarRow } from "@/components/charts/bar-row";
import { LineChart } from "@/components/charts/line-chart";
import { EmptyState, Group, Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ExplainNumber } from "@/components/progress/explain-sheet";
import { PeriodSelector } from "@/components/progress/period-selector";
import { ProgressNav } from "@/components/progress/progress-nav";
import { formatDayShort } from "@/lib/dates";
import {
  bandPosition,
  formatNumber,
  progressToTarget,
  sessionsThisWeek,
  toGoWords,
  trainingConsistency,
} from "@/lib/health/progress";
import { loadHealthProgress } from "@/lib/health/queries";
import { plural } from "@/lib/progress/metrics";
import { parsePeriod, periodWords } from "@/lib/progress/periods";
import type { Explain } from "@/lib/progress/types";

export const metadata: Metadata = { title: "Health progress" };

export default async function HealthProgressPage({ searchParams }: PageProps<"/progress/health">) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const data = await loadHealthProgress(period);
  const { targets, metrics, latest, entries } = data;
  const words = periodWords(period);

  const weightPoints = metrics.filter((m) => m.weight !== null).map((m) => ({ date: m.metric_date, value: m.weight as number }));
  const fatPoints = metrics.filter((m) => m.body_fat !== null).map((m) => ({ date: m.metric_date, value: m.body_fat as number }));
  const waistPoints = metrics.filter((m) => m.waist !== null).map((m) => ({ date: m.metric_date, value: m.waist as number }));
  const stepsPoints = metrics.filter((m) => m.steps !== null).map((m) => ({ date: m.metric_date, value: m.steps as number }));
  const energyPoints = entries.filter((e) => e.energy !== null).map((e) => ({ date: e.entry_date, value: e.energy as number }));

  const weight = progressToTarget(targets.starting_weight, latest.weight, targets.target_weight);
  const weightWords = toGoWords(weight, "kg");
  const fat = bandPosition(latest.bodyFat, targets.target_body_fat_low, targets.target_body_fat_high);
  const consistency = trainingConsistency(entries);
  const week = sessionsThisWeek(data.trainedThisWeek, targets.resistance_per_week, targets.cardio_per_week);

  const series = (pts: { value: number }[], unit: string) =>
    pts.length === 0
      ? `Nothing logged in ${words}.`
      : `${plural(pts.length, "reading")} over ${words}, from ${formatNumber(pts[0].value)} to ${formatNumber(pts[pts.length - 1].value)} ${unit}.`;

  const weightExplain: Explain = {
    value: weight.percent === null ? "Set a starting and target weight to see progress" : `${weight.percent}%`,
    inputs: [
      { label: "Starting weight", value: targets.starting_weight === null ? "Not set" : `${formatNumber(targets.starting_weight)} kg` },
      { label: "Latest weight", value: latest.weight === null ? "Not logged" : `${formatNumber(latest.weight)} kg on ${latest.weightOn}` },
      { label: "Target weight", value: targets.target_weight === null ? "Not set" : `${formatNumber(targets.target_weight)} kg` },
    ],
    arithmetic: [
      "Progress = (latest minus start) divided by (target minus start), clamped to 0 to 100",
      weight.percent !== null && targets.starting_weight !== null && latest.weight !== null && targets.target_weight !== null
        ? `(${formatNumber(latest.weight)} minus ${formatNumber(targets.starting_weight)}) divided by (${formatNumber(targets.target_weight)} minus ${formatNumber(targets.starting_weight)}) = ${weight.percent}%`
        : "Needs a start, a latest reading and a target",
    ],
    note: weight.direction === "up" ? "Your target is above your start, so progress rises as weight rises." : weight.direction === "down" ? "Your target is below your start, so progress rises as weight falls." : undefined,
  };

  const consistencyExplain: Explain = {
    value: consistency.percent === null ? "Building" : `${consistency.percent}%`,
    inputs: [
      { label: `Days with an evening check-in in ${words}`, value: String(consistency.logged) },
      { label: "Days you trained", value: String(consistency.trained) },
    ],
    arithmetic: [
      consistency.logged > 0
        ? `${consistency.trained} divided by ${consistency.logged} = ${consistency.percent}%`
        : "No evening check-ins in this period yet",
    ],
  };

  const weekExplain: Explain = {
    value: week.words,
    inputs: [
      { label: `Days trained since ${formatDayShort(data.weekStartDay)}`, value: String(week.trained) },
      { label: "Resistance sessions per week", value: targets.resistance_per_week === null ? "Not set" : String(targets.resistance_per_week) },
      { label: "Cardio sessions per week", value: targets.cardio_per_week === null ? "Not set" : String(targets.cardio_per_week) },
    ],
    arithmetic: [
      `Programme = ${targets.resistance_per_week ?? 0} resistance plus ${targets.cardio_per_week ?? 0} cardio = ${(targets.resistance_per_week ?? 0) + (targets.cardio_per_week ?? 0)} sessions`,
      `${week.trained} trained days against ${(targets.resistance_per_week ?? 0) + (targets.cardio_per_week ?? 0)}`,
    ],
    note: "In this version each day you mark Trained counts as one session. Resistance and cardio are not told apart yet.",
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Health"
        description={data.mode === "coached" ? "Your coach holds the detail. This is the direction." : "Weight, body, energy and training."}
        action={
          <Button size="sm" variant="secondary" render={<Link href="/progress/health/log" />}>
            {data.mode === "coached" ? "Weigh in" : "Log today"}
          </Button>
        }
      />
      <ProgressNav />
      <PeriodSelector basePath="/progress/health" period={period} />

      <Section title="Weight">
        {latest.weight !== null ? (
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl text-ink">{formatNumber(latest.weight)}</span>
            <span className="text-base text-ink-soft">kg{weightWords ? `, ${weightWords}` : ""}</span>
          </div>
        ) : null}
        <LineChart
          title={`Weight over ${words}`}
          points={weightPoints}
          unit="kg"
          target={targets.target_weight === null ? undefined : { value: targets.target_weight }}
          summary={`${series(weightPoints, "kg")}${weightWords ? ` ${weightWords}.` : ""}`}
        />
        {weight.percent !== null ? <BarRow label="Toward target" value={`${weight.percent}%`} percent={weight.percent} /> : null}
      </Section>

      <Section title="Body fat">
        {latest.bodyFat !== null ? (
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold tracking-tight text-ink">{formatNumber(latest.bodyFat)}%</span>
            {fat.words ? <span className="text-base text-ink-soft">{fat.words}</span> : null}
          </div>
        ) : null}
        <LineChart
          title={`Body fat over ${words}`}
          points={fatPoints}
          unit="%"
          band={
            targets.target_body_fat_low !== null && targets.target_body_fat_high !== null
              ? { low: targets.target_body_fat_low, high: targets.target_body_fat_high, label: `Target ${formatNumber(Math.min(targets.target_body_fat_low, targets.target_body_fat_high))} to ${formatNumber(Math.max(targets.target_body_fat_low, targets.target_body_fat_high))}%` }
              : undefined
          }
          summary={`${series(fatPoints, "%")}${fat.words ? ` ${fat.words}.` : ""}`}
        />
      </Section>

      {waistPoints.length > 0 ? (
        <Section title="Waist">
          <LineChart title={`Waist over ${words}`} points={waistPoints} unit="cm" summary={series(waistPoints, "cm")} />
        </Section>
      ) : null}

      <Section title="Energy" description="From the evening check-in, 1 to 10.">
        <LineChart title={`Energy over ${words}`} points={energyPoints} include={[1, 10]} summary={series(energyPoints, "of 10")} />
      </Section>

      <Section title="Training">
        <Group>
          <ExplainNumber
            label="Training consistency"
            value={consistency.percent === null ? "Building" : `${consistency.percent}%`}
            word={`${consistency.trained} of ${plural(consistency.logged, "logged day")}`}
            explain={consistencyExplain}
          />
          <ExplainNumber label="Sessions this week" value={String(week.trained)} word={week.words} explain={weekExplain} />
          <ExplainNumber
            label="Weight toward target"
            value={weight.percent === null ? "Set targets" : `${weight.percent}%`}
            word={weightWords ?? undefined}
            explain={weightExplain}
          />
        </Group>
      </Section>

      {stepsPoints.length > 0 ? (
        <Section title="Steps">
          <LineChart
            title={`Steps over ${words}`}
            points={stepsPoints}
            target={targets.steps_per_day === null ? undefined : { value: targets.steps_per_day, label: `Target ${targets.steps_per_day.toLocaleString("en-AU")}` }}
            summary={series(stepsPoints, "steps")}
          />
        </Section>
      ) : null}

      {weightPoints.length === 0 && fatPoints.length === 0 && entries.length === 0 ? (
        <EmptyState action={<Button render={<Link href="/progress/health/log" />}>{data.mode === "coached" ? "Weigh in" : "Log today"}</Button>}>
          Log a reading and the trends will begin.
        </EmptyState>
      ) : null}

      <p className="text-sm text-ink-soft">
        Targets, programme and mode live in{" "}
        <Link href="/more/health" className="text-harbour underline-offset-4 hover:underline">
          health settings
        </Link>
        .
      </p>
    </div>
  );
}
