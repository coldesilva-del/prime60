import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState, Group, Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { InteractionLogger } from "@/components/relationships/interaction-logger";
import { PersonSettings } from "@/components/relationships/person-settings";
import { formatDayShort } from "@/lib/dates";
import { loadPerson } from "@/lib/relationships/queries";
import { driftNote, INTERACTION_LABEL, isDrifting, sinceWords } from "@/lib/relationships/drift";

export const metadata: Metadata = { title: "Person" };

export default async function PersonPage({ params }: PageProps<"/more/people/[id]">) {
  const { id } = await params;
  const personId = Number(id);
  if (!Number.isInteger(personId) || personId <= 0) notFound();

  const data = await loadPerson(personId);
  if (!data) notFound();
  const { person, group, isPartner, recent, today, lastOn } = data;
  const drifting = isDrifting(lastOn, person.cadence_days, today);

  return (
    <div className="space-y-8">
      <PageHeader title={person.name} eyebrow={group?.label} backHref="/more/people" description={`Last connected: ${sinceWords(lastOn, today).toLowerCase()}.`} />

      {drifting ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ember" />
          {driftNote(person.name)}
        </p>
      ) : null}

      <Section title="Record an interaction">
        <InteractionLogger personId={person.id} name={person.name} isPartner={isPartner} />
      </Section>

      <Section title="Recent">
        {recent.length === 0 ? (
          <EmptyState>Nothing recorded yet.</EmptyState>
        ) : (
          <Group>
            {recent.map((i) => (
              <div key={i.id} className="space-y-1 px-4 py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-base text-ink">{INTERACTION_LABEL[i.kind]}</span>
                  <span className="text-xs text-ink-soft">{formatDayShort(i.occurred_on)}</span>
                </div>
                {i.connection_rating !== null ? <p className="text-sm text-ink-soft">Connection {i.connection_rating} of 10</p> : null}
                {i.note ? <p className="text-sm text-ink-soft">{i.note}</p> : null}
              </div>
            ))}
          </Group>
        )}
      </Section>

      <Section title="Details">
        <PersonSettings id={person.id} name={person.name} cadenceDays={person.cadence_days} isActive={person.is_active} />
      </Section>
    </div>
  );
}
