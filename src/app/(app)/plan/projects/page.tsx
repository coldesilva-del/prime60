import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlanNav } from "@/components/plan/plan-nav";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, Group, Hairline, Section } from "@/components/layout/section";
import { FinishedControl } from "@/components/plan/finished-control";
import { FinishRatioBlock } from "@/components/plan/finish-ratio-block";
import { requireProfile } from "@/lib/profile";
import { getFinishRatioSummary, groupProjects, listProjects } from "@/lib/projects/queries";
import { PILLARS, STATUS_LABELS } from "@/lib/projects/schemas";
import type { ProjectRow, ProjectStatus } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Projects" };

const pillarLabel = (value: string) => PILLARS.find((p) => p.value === value)?.label ?? value;

function ProjectRowLink({ project, action }: { project: ProjectRow; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <Link href={`/plan/projects/${project.id}`} className="min-w-0 flex-1 space-y-0.5 py-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-base font-medium text-ink">{project.name}</span>
          <span className="shrink-0 text-xs text-ink-faint">{pillarLabel(project.pillar)}</span>
        </span>
        {project.next_action ? (
          <span className="block truncate text-sm text-ink-soft">Next: {project.next_action}</span>
        ) : project.status === "active" ? (
          <span className="block text-sm text-ink-faint">No next action yet</span>
        ) : null}
      </Link>
      {action ?? <ChevronRight className="mt-2 size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />}
    </div>
  );
}

function Disclosure({ status, projects }: { status: ProjectStatus; projects: ProjectRow[] }) {
  return (
    <details className="group">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between text-base text-ink [&::-webkit-details-marker]:hidden">
        <span>
          {STATUS_LABELS[status]} <span className="text-ink-faint">({projects.length})</span>
        </span>
        <ChevronRight className="size-4 text-ink-faint transition-transform group-open:rotate-90" strokeWidth={1.75} aria-hidden />
      </summary>
      {projects.length ? (
        <Group className="mt-2">
          {projects.map((p) => (
            <ProjectRowLink key={p.id} project={p} />
          ))}
        </Group>
      ) : (
        <p className="pb-3 text-sm text-ink-faint">None.</p>
      )}
    </details>
  );
}

export default async function ProjectsPage() {
  const profile = await requireProfile();
  const [projects, summary] = await Promise.all([
    listProjects(profile.user_id),
    getFinishRatioSummary(profile.user_id),
  ]);
  const groups = groupProjects(projects);
  const limit = profile.active_project_limit;

  return (
    <div className="space-y-8">
      <PlanNav />
      <PageHeader
        title="Projects"
        eyebrow={`${groups.active.length} of ${limit} active`}
        action={
          <Link href="/plan/projects/new" className="inline-flex h-11 items-center text-sm font-medium text-harbour">
            New project
          </Link>
        }
      />

      <Section title="Active">
        {groups.active.length ? (
          <Group>
            {groups.active.map((p) => (
              <ProjectRowLink key={p.id} project={p} action={<FinishedControl projectId={p.id} name={p.name} />} />
            ))}
          </Group>
        ) : (
          <EmptyState
            action={
              <Link href="/plan/projects/new" className="inline-flex h-11 items-center text-sm font-medium text-harbour">
                Start one
              </Link>
            }
          >
            Nothing active yet. One finished project is worth more than three started.
          </EmptyState>
        )}
      </Section>

      <Hairline />

      <div className="divide-y divide-hairline">
        <Disclosure status="paused" projects={groups.paused} />
        <Disclosure status="blocked" projects={groups.blocked} />
        <Disclosure status="idea" projects={groups.idea} />
        <Disclosure status="finished" projects={groups.finished} />
        <Disclosure status="killed" projects={groups.killed} />
      </div>

      <Hairline />

      <Section title="Finish Ratio">
        <FinishRatioBlock summary={summary} />
      </Section>

      <p className="measure text-sm text-ink-soft">
        The loop: idea, decide, execute, finish, publish, evidence, improve.
      </p>
    </div>
  );
}
