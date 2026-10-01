import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { PlanNav } from "@/components/plan/plan-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Hairline } from "@/components/layout/section";
import { IdeaEditor } from "@/components/plan/idea-editor";
import { IdeaFilter } from "@/components/plan/idea-filter";
import { requireProfile } from "@/lib/profile";
import { formatDayLong } from "@/lib/dates";
import { getIdea } from "@/lib/ideas/queries";

export const metadata: Metadata = { title: "Idea" };

export default async function IdeaPage({ params }: PageProps<"/plan/ideas/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const profile = await requireProfile();
  const idea = await getIdea(profile.user_id, id);
  if (!idea) notFound();

  const captured = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: profile.timezone,
  }).format(new Date(idea.captured_at));
  const ago = formatDistanceToNowStrict(new Date(idea.captured_at), { addSuffix: true });

  const statusLine =
    idea.decision === "kill"
      ? "Killed. Park it to bring it back."
      : idea.decision === "pursue" && idea.project_id
        ? null
        : idea.decision === "review_30" && idea.review_on
          ? `Set aside for review on ${formatDayLong(idea.review_on)}.`
          : idea.decision === "park"
            ? "Parked."
            : null;

  return (
    <div className="space-y-8">
      <PlanNav />
      <PageHeader title={idea.title} backHref="/plan/ideas" eyebrow={`Captured ${captured}, ${ago}`} />

      {statusLine ? <p className="text-sm text-ink-soft">{statusLine}</p> : null}
      {idea.decision === "pursue" && idea.project_id ? (
        <p className="text-sm text-ink-soft">
          Pursued.{" "}
          <Link href={`/plan/projects/${idea.project_id}`} className="text-harbour underline-offset-4 hover:underline">
            Open the project
          </Link>
          .
        </p>
      ) : null}

      <IdeaEditor idea={idea} />

      <Hairline />

      <IdeaFilter idea={idea} />
    </div>
  );
}
