import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlanNav } from "@/components/plan/plan-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Hairline, Section } from "@/components/layout/section";
import { ProjectForm } from "@/components/plan/project-form";
import { StatusControls } from "@/components/plan/status-controls";
import { requireProfile } from "@/lib/profile";
import { formatDayShort } from "@/lib/dates";
import { getProject, getProjectHistory } from "@/lib/projects/queries";
import { STATUS_LABELS } from "@/lib/projects/schemas";
import type { ProjectStatus } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Project" };

function statusLabel(value: string | null): string {
  return value && value in STATUS_LABELS ? STATUS_LABELS[value as ProjectStatus] : "Created";
}

export default async function ProjectPage({ params, searchParams }: PageProps<"/plan/projects/[id]">) {
  const { id: rawId } = await params;
  const sp = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const profile = await requireProfile();
  const project = await getProject(profile.user_id, id);
  if (!project) notFound();
  const history = await getProjectHistory(profile.user_id, id);

  const dateFmt = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: profile.timezone,
  });

  const eyebrowParts = [STATUS_LABELS[project.status]];
  if (project.started_on) eyebrowParts.push(`started ${formatDayShort(project.started_on)}`);
  if (project.finished_on) eyebrowParts.push(`finished ${formatDayShort(project.finished_on)}`);
  if (project.limit_overridden) eyebrowParts.push("limit overridden");

  return (
    <div className="space-y-8">
      <PlanNav />
      <PageHeader title={project.name} backHref="/plan/projects" eyebrow={eyebrowParts.join(", ")} />

      <StatusControls project={project} activatePrompt={sp.activate === "1"} />

      {project.idea_id ? (
        <p className="text-sm text-ink-soft">
          From the{" "}
          <Link href={`/plan/ideas/${project.idea_id}`} className="text-harbour underline-offset-4 hover:underline">
            Idea Parking Lot
          </Link>
          .
        </p>
      ) : null}

      <Hairline />

      <Section title="Details">
        <ProjectForm mode="edit" project={project} />
      </Section>

      <Hairline />

      <Section title="History">
        {history.length ? (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink">
                  {statusLabel(h.from_status)} to {statusLabel(h.to_status)}
                  {h.note ? <span className="text-ink-faint"> ({h.note})</span> : null}
                </span>
                <span className="shrink-0 text-ink-faint">{dateFmt.format(new Date(h.changed_at))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-faint">No status changes yet.</p>
        )}
      </Section>
    </div>
  );
}
