"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import type { ProjectStatus } from "@/lib/supabase/types";
import type { LimitChoice } from "./active-limit";
import { transitionProject } from "./status";
import {
  changeStatusSchema,
  createProjectSchema,
  updateProjectSchema,
  type ActionState,
  type LimitPrompt,
  type ProjectFieldsInput,
  type StatusChangeResult,
} from "./schemas";

function revalidateProjects(id?: number) {
  revalidatePath("/plan");
  revalidatePath("/plan/projects");
  revalidatePath("/plan/ideas");
  revalidatePath("/today");
  revalidatePath("/progress");
  if (id) revalidatePath(`/plan/projects/${id}`);
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type CreateProjectResult =
  | { ok: true; projectId: number; status: ProjectStatus }
  | { error?: string; fieldErrors?: Record<string, string> }
  | { limit: LimitPrompt; projectId: number };

/**
 * Create a project. Always saved as an idea first so the row exists, then
 * moved to active when requested, which may need the limit dialog.
 */
export async function createProjectAction(
  input: ProjectFieldsInput & { startActive?: boolean; choice?: LimitChoice },
): Promise<CreateProjectResult> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { startActive, ...fields } = parsed.data;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ user_id: profile.user_id, ...fields, status: "idea" })
    .select("*")
    .single();
  if (error || !project) return { error: "Could not create the project. Try again." };

  await supabase.from("project_status_history").insert({
    user_id: profile.user_id,
    project_id: project.id,
    from_status: null,
    to_status: "idea",
    note: "created",
  });

  if (!startActive) {
    revalidateProjects(project.id);
    return { ok: true, projectId: project.id, status: "idea" };
  }

  const result = await transitionProject(
    supabase,
    profile.user_id,
    project,
    "active",
    todayIn(profile.timezone),
    profile.active_project_limit,
    null,
    input.choice,
  );
  revalidateProjects(project.id);
  if ("error" in result) return { error: result.error };
  if ("limit" in result) return { limit: result.limit, projectId: project.id };
  return { ok: true, projectId: project.id, status: result.status };
}

export async function updateProjectAction(input: ProjectFieldsInput & { id: number }): Promise<ActionState> {
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { id, ...fields } = parsed.data;
  const { error } = await supabase
    .from("projects")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("user_id", profile.user_id)
    .eq("id", id);
  if (error) return { error: "Could not save the project. Try again." };

  revalidateProjects(id);
  return { ok: true };
}

/**
 * Change status. Moving to active beyond the limit returns `limit` so the
 * client can show the dialog, then calls again with the user's choice.
 */
export async function changeProjectStatusAction(input: {
  id: number;
  toStatus: ProjectStatus;
  note?: string | null;
  choice?: LimitChoice;
}): Promise<StatusChangeResult> {
  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Something went wrong. Try again." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!project) return { error: "That project could not be found." };

  const result = await transitionProject(
    supabase,
    profile.user_id,
    project,
    parsed.data.toStatus,
    todayIn(profile.timezone),
    profile.active_project_limit,
    parsed.data.note ?? null,
    parsed.data.choice,
  );
  revalidateProjects(project.id);
  if ("error" in result) return { error: result.error };
  if ("limit" in result) return { limit: result.limit, projectId: project.id };
  return { ok: true, projectId: project.id, status: result.status };
}
