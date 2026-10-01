"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { changeProjectStatusAction } from "@/lib/projects/actions";
import type { LimitChoice } from "@/lib/projects/active-limit";
import type { LimitPrompt } from "@/lib/projects/schemas";
import type { ProjectRow, ProjectStatus } from "@/lib/supabase/types";
import { ActiveLimitDialog } from "./active-limit-dialog";

interface StatusControlsProps {
  project: ProjectRow;
  /** Arrived from "Pursue" on an idea: show the prompt to activate. */
  activatePrompt?: boolean;
}

/** Status changes for one project. Moving to active may open the limit dialog. */
export function StatusControls({ project, activatePrompt }: StatusControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<LimitPrompt | null>(null);
  const [confirmKill, setConfirmKill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(toStatus: ProjectStatus, choice?: LimitChoice) {
    setError(null);
    startTransition(async () => {
      const res = await changeProjectStatusAction({ id: project.id, toStatus, choice });
      if ("error" in res) {
        setError(res.error);
        setPrompt(null);
        return;
      }
      if ("limit" in res) {
        setPrompt(res.limit);
        return;
      }
      setPrompt(null);
      setConfirmKill(false);
      if (activatePrompt) router.replace(pathname, { scroll: false });
      router.refresh();
    });
  }

  const s = project.status;

  return (
    <div className="space-y-4">
      {activatePrompt && s === "idea" ? (
        <p className="rounded-[16px] bg-surface-raised px-4 py-3 text-base text-ink">
          Pursuing this idea. Make it active when you are ready to start.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {s === "active" ? (
          <>
            <Button disabled={pending} onClick={() => change("finished")}>
              Finished
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => change("paused")}>
              Pause
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => change("blocked")}>
              Blocked
            </Button>
          </>
        ) : null}
        {s === "idea" || s === "paused" || s === "blocked" ? (
          <Button disabled={pending} onClick={() => change("active")}>
            Make active
          </Button>
        ) : null}
        {s === "blocked" ? (
          <Button variant="secondary" disabled={pending} onClick={() => change("paused")}>
            Pause
          </Button>
        ) : null}
        {s === "finished" ? (
          <Button variant="secondary" disabled={pending} onClick={() => change("active")}>
            Reopen as active
          </Button>
        ) : null}
        {s === "killed" ? (
          <Button variant="secondary" disabled={pending} onClick={() => change("idea")}>
            Restore as idea
          </Button>
        ) : null}
        {s !== "killed" && s !== "finished" && !confirmKill ? (
          <Button variant="ghost" className="text-ink-soft" disabled={pending} onClick={() => setConfirmKill(true)}>
            Kill
          </Button>
        ) : null}
      </div>

      {confirmKill ? (
        <div className="space-y-3 rounded-[16px] bg-surface px-4 py-4">
          <p className="text-base text-ink">Kill this project? It stays in the Killed list and can be restored.</p>
          <div className="flex gap-2">
            <Button variant="destructive" disabled={pending} onClick={() => change("killed")}>
              Kill it
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setConfirmKill(false)}>
              Keep it
            </Button>
          </div>
        </div>
      ) : null}

      <ActiveLimitDialog
        prompt={prompt}
        fromIdea={project.idea_id !== null}
        pending={pending}
        onChoose={(choice) => change("active", choice)}
        onCancel={() => setPrompt(null)}
      />
    </div>
  );
}
