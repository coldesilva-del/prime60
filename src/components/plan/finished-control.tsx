"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { changeProjectStatusAction } from "@/lib/projects/actions";

/** One tap on the projects list: marks an active project finished. */
export function FinishedControl({ projectId, name }: { projectId: number; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await changeProjectStatusAction({ id: projectId, toStatus: "finished" });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="shrink-0">
      <Button variant="outline" size="sm" disabled={pending} onClick={finish} aria-label={`Mark ${name} finished`}>
        {pending ? "Saving" : "Finished"}
      </Button>
      {error ? (
        <p className="mt-1 text-xs text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
