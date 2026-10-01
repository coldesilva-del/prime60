import type { Metadata } from "next";
import Link from "next/link";
import { Sparkline } from "@/components/charts/sparkline";
import { EmptyState, Group, Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "@/components/progress/period-selector";
import { ProgressNav } from "@/components/progress/progress-nav";
import { plural } from "@/lib/progress/metrics";
import { parsePeriod, periodWords } from "@/lib/progress/periods";
import { loadRelationshipsProgress } from "@/lib/progress/queries";
import { cadenceWords, sinceWords } from "@/lib/relationships/drift";

export const metadata: Metadata = { title: "Relationships progress" };

export default async function RelationshipsProgressPage({ searchParams }: PageProps<"/progress/relationships">) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const data = await loadRelationshipsProgress(period);
  const words = periodWords(period);

  const ratings = data.partnerRatings;
  const first = ratings[0];
  const last = ratings[ratings.length - 1];
  const ratingSummary =
    ratings.length === 0
      ? ""
      : ratings.length === 1
        ? `One connection rating of ${first.value} in ${words}.`
        : `Connection rating ${first.value} then ${last.value}, ${plural(ratings.length, "rating")} over ${words}.`;

  return (
    <div className="space-y-8">
      <PageHeader title="Relationships" description="Who received the best of you." />
      <ProgressNav />
      <PeriodSelector basePath="/progress/relationships" period={period} />

      <Section title="People">
        {data.people.length === 0 ? (
          <EmptyState action={<Button variant="secondary" render={<Link href="/more/people" />}>Add people</Button>}>
            Add the people who matter and their connections will show here.
          </EmptyState>
        ) : (
          <Group>
            {data.people.map((p) => (
              <Link
                key={p.id}
                href={`/more/people/${p.id}`}
                className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-raised"
              >
                <span>
                  <span className="block text-base text-ink">{p.name}</span>
                  <span className="block text-xs text-ink-soft">
                    {p.groupLabel}, {cadenceWords(p.cadenceDays).toLowerCase()}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm text-ink">{sinceWords(p.lastOn, data.today)}</span>
                  <span className="block text-xs text-ink-soft">
                    {plural(p.countInPeriod, "interaction")} in {words}
                  </span>
                </span>
              </Link>
            ))}
          </Group>
        )}
      </Section>

      {ratings.length > 0 ? (
        <Section title="Connection with your partner">
          <div className="flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold tracking-tight text-ink">{last.value}</p>
            <Sparkline title="Partner connection rating" points={ratings} summary={ratingSummary} width={140} height={36} />
          </div>
        </Section>
      ) : null}

      <p className="font-display text-lg text-ink-soft">{data.weeklyQuestion}</p>
    </div>
  );
}
