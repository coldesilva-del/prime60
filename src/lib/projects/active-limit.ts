/**
 * Active project limit. Pure decision logic so the dialog flow is testable
 * without a database. Moving a project to active beyond the limit needs a
 * deliberate choice: finish one, pause one, kill one, park this, or override.
 */

import type { ProjectStatus } from "@/lib/supabase/types";

export type LimitChoice =
  | { kind: "finish"; projectId: number }
  | { kind: "pause"; projectId: number }
  | { kind: "kill"; projectId: number }
  | { kind: "park" }
  | { kind: "override" };

export interface StatusStep {
  projectId: number;
  toStatus: ProjectStatus;
  note: string | null;
}

export type ActivationPlan =
  | { kind: "activate"; steps: StatusStep[]; overridden: boolean }
  | { kind: "park"; steps: StatusStep[] }
  | { kind: "needs_choice"; activeCount: number; limit: number }
  | { kind: "invalid"; reason: string };

export interface ActivationInput {
  /** The project being moved to active. */
  targetId: number;
  /** Current status of the target project. */
  targetStatus: ProjectStatus;
  /** Ids of projects currently active, excluding the target. */
  activeIds: number[];
  /** profile.active_project_limit */
  limit: number;
  /** The user's answer to the dialog, if it was shown. */
  choice?: LimitChoice;
}

/** True when moving one more project to active would exceed the limit. */
export function exceedsLimit(activeCount: number, limit: number): boolean {
  return activeCount + 1 > Math.max(1, limit);
}

/**
 * Decide what status changes to apply for an activation request.
 * Steps are applied in order; the target's own activation is always last.
 */
export function planActivation(input: ActivationInput): ActivationPlan {
  const { targetId, targetStatus, limit, choice } = input;
  const activeIds = input.activeIds.filter((id) => id !== targetId);

  if (targetStatus === "active") {
    return { kind: "activate", steps: [], overridden: false };
  }

  if (!exceedsLimit(activeIds.length, limit)) {
    return { kind: "activate", steps: [{ projectId: targetId, toStatus: "active", note: null }], overridden: false };
  }

  if (!choice) {
    return { kind: "needs_choice", activeCount: activeIds.length, limit };
  }

  switch (choice.kind) {
    case "finish":
    case "pause":
    case "kill": {
      if (!activeIds.includes(choice.projectId)) {
        return { kind: "invalid", reason: "That project is not active." };
      }
      const toStatus: ProjectStatus =
        choice.kind === "finish" ? "finished" : choice.kind === "pause" ? "paused" : "killed";
      return {
        kind: "activate",
        overridden: false,
        steps: [
          { projectId: choice.projectId, toStatus, note: `made room for project ${targetId}` },
          { projectId: targetId, toStatus: "active", note: null },
        ],
      };
    }
    case "park": {
      const steps: StatusStep[] =
        targetStatus === "idea" ? [] : [{ projectId: targetId, toStatus: "idea", note: "parked at the active limit" }];
      return { kind: "park", steps };
    }
    case "override":
      return {
        kind: "activate",
        overridden: true,
        steps: [{ projectId: targetId, toStatus: "active", note: "override" }],
      };
  }
}
