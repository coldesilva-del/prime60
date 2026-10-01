import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { PlanNav } from "@/components/plan/plan-nav";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, Group, Hairline, Section } from "@/components/layout/section";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import { listIdeas } from "@/lib/ideas/queries";
import type { IdeaRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Ideas" };

function age(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

function IdeaLink({ idea, note }: { idea: IdeaRow; note?: string }) {
  return (
    <Link href={`/plan/ideas/${idea.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised">
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block truncate text-base text-ink">{idea.title}</span>
        <span className="block text-sm text-ink-soft">
          {note ? `${note}, ` : ""}
          {age(idea.captured_at)}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}

function Disclosure({ label, ideas }: { label: string; ideas: IdeaRow[] }) {
  if (!ideas.length) return null;
  return (
    <details className="group">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between text-base text-ink [&::-webkit-details-marker]:hidden">
        <span>
          {label} <span className="text-ink-faint">({ideas.length})</span>
        </span>
        <ChevronRight className="size-4 text-ink-faint transition-transform group-open:rotate-90" strokeWidth={1.75} aria-hidden />
      </summary>
      <Group className="mt-2">
        {ideas.map((i) => (
          <IdeaLink key={i.id} idea={i} />
        ))}
      </Group>
    </details>
  );
}

export default async function IdeasPage() {
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const lists = await listIdeas(profile.user_id, today);
  const nothingParked = lists.due.length === 0 && lists.parked.length === 0;

  return (
    <div className="space-y-8">
      <PlanNav />
      <PageHeader
        title="Idea Parking Lot"
        description="Capture it, leave it, come back when you are ready."
        action={
          <Link href="/plan/ideas?log=idea" className="inline-flex h-11 items-center text-sm font-medium text-harbour">
            Park an idea
          </Link>
        }
      />

      {lists.due.length ? (
        <Section title="Due for a look" description="You asked to see these again.">
          <Group>
            {lists.due.map((i) => (
              <IdeaLink key={i.id} idea={i} note="Review" />
            ))}
          </Group>
        </Section>
      ) : null}

      <Section title="Parked">
        {lists.parked.length ? (
          <Group>
            {lists.parked.map((i) => (
              <IdeaLink key={i.id} idea={i} note={i.decision === "review_30" ? "Review later" : undefined} />
            ))}
          </Group>
        ) : nothingParked ? (
          <EmptyState
            action={
              <Link href="/plan/ideas?log=idea" className="inline-flex h-11 items-center text-sm font-medium text-harbour">
                Park an idea
              </Link>
            }
          >
            Nothing parked. The next idea goes here instead of into your week.
          </EmptyState>
        ) : (
          <p className="text-sm text-ink-faint">Everything parked is due for a look.</p>
        )}
      </Section>

      {lists.pursued.length || lists.killed.length ? <Hairline /> : null}

      <div className="divide-y divide-hairline">
        <Disclosure label="Pursued" ideas={lists.pursued} />
        <Disclosure label="Killed" ideas={lists.killed} />
      </div>
    </div>
  );
}
