import Link from "next/link";
import { cn } from "cn";
import { Group, Section } from "@/components/layout/section";
import { countByPillar, PILLAR_GUIDELINES, PILLAR_LABELS, PILLAR_ORDER } from "@/lib/cycles/dates";
import { STATUS_LABELS, type ObjectiveStatus } from "@/lib/cycles/schemas";
import type { ObjectiveRow } from "@/lib/supabase/types";

export function StatusChip({ status }: { status: ObjectiveStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "done" ? "bg-harbour-soft text-harbour" : "bg-surface-raised text-ink-soft",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

interface ObjectiveListProps {
  objectives: ObjectiveRow[];
}

/** Objectives grouped by pillar, each row a link to its detail. Words, not colours. */
export function ObjectiveList({ objectives }: ObjectiveListProps) {
  const counts = countByPillar(objectives);
  return (
    <div className="space-y-6">
      {PILLAR_ORDER.map((pillar) => {
        const rows = objectives.filter((o) => o.pillar === pillar);
        const guide = PILLAR_GUIDELINES[pillar];
        return (
          <Section
            key={pillar}
            title={PILLAR_LABELS[pillar]}
            action={
              <span className="text-xs text-ink-faint">
                {counts[pillar]} of {guide.text.toLowerCase()}
              </span>
            }
          >
            {rows.length ? (
              <Group>
                {rows.map((o) => (
                  <Link
                    key={o.id}
                    href={`/plan/cycle/objectives/${o.id}`}
                    className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-raised"
                  >
                    <span className="min-w-0">
                      <span className="block text-base text-ink">{o.outcome}</span>
                      {o.next_action ? (
                        <span className="block truncate text-sm text-ink-soft">Next: {o.next_action}</span>
                      ) : null}
                    </span>
                    <StatusChip status={o.status} />
                  </Link>
                ))}
              </Group>
            ) : (
              <p className="text-sm text-ink-faint">Nothing here yet.</p>
            )}
          </Section>
        );
      })}
    </div>
  );
}
