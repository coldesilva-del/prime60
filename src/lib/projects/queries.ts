import { createClient } from "@/lib/supabase/server";
import { computeFinishRatio, type FinishRatio } from "@/lib/scoring/finish-ratio";
import type { ProjectRow, ProjectStatus, ProjectStatusHistoryRow } from "@/lib/supabase/types";

export async function listProjects(userId: string): Promise<ProjectRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return data ?? [];
}

export type GroupedProjects = Record<ProjectStatus, ProjectRow[]>;

export function groupProjects(projects: ProjectRow[]): GroupedProjects {
  const groups: GroupedProjects = { active: [], paused: [], blocked: [], idea: [], finished: [], killed: [] };
  for (const p of projects) groups[p.status].push(p);
  groups.active.sort((a, b) => (a.started_on ?? "").localeCompare(b.started_on ?? "") || a.id - b.id);
  return groups;
}

export async function getProject(userId: string, id: number): Promise<ProjectRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the project: ${error.message}`);
  return data;
}

export async function getProjectHistory(userId: string, projectId: number): Promise<ProjectStatusHistoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_status_history")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("changed_at", { ascending: false });
  if (error) throw new Error(`Could not load history: ${error.message}`);
  return data ?? [];
}

export type FinishRatioSummary = {
  /** Always shown: counts for the last 30 days. */
  thirty: FinishRatio;
  /** Ratio for the last 90 days; ratio is null until three starts. */
  ninety: FinishRatio;
};

/** Finish Ratio from project_status_history, per PRD 7.2. */
export async function getFinishRatioSummary(userId: string, now: Date = new Date()): Promise<FinishRatioSummary> {
  const supabase = await createClient();
  const end = now.toISOString();
  const start90 = new Date(now.getTime() - 90 * 86400000).toISOString();
  const start30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("project_status_history")
    .select("project_id, to_status, changed_at")
    .eq("user_id", userId)
    .in("to_status", ["active", "finished"])
    .gte("changed_at", start90);
  if (error) throw new Error(`Could not load the Finish Ratio: ${error.message}`);

  const changes = (data ?? []).map((row) => ({
    projectId: row.project_id,
    toStatus: row.to_status,
    changedAt: row.changed_at,
  }));

  return {
    thirty: computeFinishRatio(changes, start30, end),
    ninety: computeFinishRatio(changes, start90, end),
  };
}

export async function countActiveProjects(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  return count ?? 0;
}
