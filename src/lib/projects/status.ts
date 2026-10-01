/**
 * Server-side helpers shared by the projects and ideas actions.
 * Not a server action module: import only from "use server" files or server components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProjectRow, ProjectStatus } from "@/lib/supabase/types";
import { planActivation, type LimitChoice, type StatusStep } from "./active-limit";
import type { LimitPrompt } from "./schemas";

type Db = SupabaseClient<Database>;

/**
 * Apply one status change: update the project row (started_on on first
 * activation, finished_on on finish) and write project_status_history.
 */
export async function applyStatusStep(
  db: Db,
  userId: string,
  project: Pick<ProjectRow, "id" | "status" | "started_on">,
  step: StatusStep,
  today: string,
  extra: Partial<Pick<ProjectRow, "limit_overridden">> = {},
): Promise<{ error?: string }> {
  if (project.status === step.toStatus && Object.keys(extra).length === 0) return {};

  const patch: Partial<ProjectRow> = { status: step.toStatus, ...extra };
  if (step.toStatus === "active" && !project.started_on) patch.started_on = today;
  if (step.toStatus === "finished") patch.finished_on = today;

  const { error } = await db.from("projects").update(patch).eq("user_id", userId).eq("id", project.id);
  if (error) return { error: "Could not update the project. Try again." };

  if (project.status !== step.toStatus) {
    const { error: histError } = await db.from("project_status_history").insert({
      user_id: userId,
      project_id: project.id,
      from_status: project.status,
      to_status: step.toStatus,
      note: step.note,
    });
    if (histError) return { error: "Could not record the status change. Try again." };
  }
  return {};
}

export async function listActiveProjects(db: Db, userId: string): Promise<Pick<ProjectRow, "id" | "name">[]> {
  const { data } = await db
    .from("projects")
    .select("id, name")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_on", { ascending: true });
  return data ?? [];
}

export type TransitionResult =
  | { ok: true; status: ProjectStatus }
  | { error: string }
  | { limit: LimitPrompt };

/**
 * Move a project to a new status, running the active-limit decision when the
 * target is active. Non-active transitions apply directly.
 */
export async function transitionProject(
  db: Db,
  userId: string,
  project: ProjectRow,
  toStatus: ProjectStatus,
  today: string,
  limit: number,
  note: string | null = null,
  choice?: LimitChoice,
): Promise<TransitionResult> {
  if (toStatus !== "active") {
    const res = await applyStatusStep(db, userId, project, { projectId: project.id, toStatus, note }, today);
    if (res.error) return { error: res.error };
    return { ok: true, status: toStatus };
  }

  const active = await listActiveProjects(db, userId);
  const plan = planActivation({
    targetId: project.id,
    targetStatus: project.status,
    activeIds: active.map((p) => p.id),
    limit,
    choice,
  });

  if (plan.kind === "invalid") return { error: plan.reason };
  if (plan.kind === "needs_choice") {
    return {
      limit: {
        activeCount: plan.activeCount,
        limit: plan.limit,
        active: active.filter((p) => p.id !== project.id),
      },
    };
  }

  const byId = new Map<number, Pick<ProjectRow, "id" | "status" | "started_on">>();
  byId.set(project.id, project);
  for (const step of plan.steps) {
    if (!byId.has(step.projectId)) {
      const { data } = await db
        .from("projects")
        .select("id, status, started_on")
        .eq("user_id", userId)
        .eq("id", step.projectId)
        .maybeSingle();
      if (!data) return { error: "That project could not be found." };
      byId.set(step.projectId, data);
    }
    const row = byId.get(step.projectId)!;
    const extra = plan.kind === "activate" && plan.overridden && step.projectId === project.id ? { limit_overridden: true } : {};
    const res = await applyStatusStep(db, userId, row, step, today, extra);
    if (res.error) return { error: res.error };
    byId.set(step.projectId, { ...row, status: step.toStatus });
  }

  if (plan.kind === "park") {
    if (project.idea_id) {
      await db
        .from("ideas")
        .update({ decision: "park", decided_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", project.idea_id);
    }
    return { ok: true, status: "idea" };
  }

  return { ok: true, status: "active" };
}
