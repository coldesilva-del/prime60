import type { Metadata } from "next";
import { PlanNav } from "@/components/plan/plan-nav";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectForm } from "@/components/plan/project-form";
import { requireProfile } from "@/lib/profile";
import { countActiveProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const profile = await requireProfile();
  const active = await countActiveProjects(profile.user_id);

  return (
    <div className="space-y-8">
      <PlanNav />
      <PageHeader
        title="New project"
        backHref="/plan/projects"
        eyebrow={`${active} of ${profile.active_project_limit} active`}
        description="Name it, say what finished looks like, and write the next action."
      />
      <ProjectForm mode="new" />
    </div>
  );
}
