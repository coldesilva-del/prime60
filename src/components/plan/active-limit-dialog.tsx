"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LimitChoice } from "@/lib/projects/active-limit";
import type { LimitPrompt } from "@/lib/projects/schemas";

interface ActiveLimitDialogProps {
  prompt: LimitPrompt | null;
  /** True when the project came from the Idea Parking Lot. */
  fromIdea?: boolean;
  pending?: boolean;
  onChoose: (choice: LimitChoice) => void;
  onCancel: () => void;
}

type Picking = "finish" | "pause" | "kill" | null;

const optionClass =
  "flex min-h-12 w-full items-center rounded-[10px] bg-surface-raised px-4 text-left text-[15px] font-medium text-ink transition-colors hover:bg-hairline/70 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50";

/**
 * "You already have N active priorities. What will this replace?"
 * Five options. Finish, pause and kill ask which active project.
 */
export function ActiveLimitDialog({ prompt, fromIdea, pending, onChoose, onCancel }: ActiveLimitDialogProps) {
  const [picking, setPicking] = useState<Picking>(null);

  const open = prompt !== null;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPicking(null);
      onCancel();
    }
  }

  const verb = picking === "finish" ? "Finish" : picking === "pause" ? "Pause" : "Kill";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[24px] bg-surface p-5 sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-semibold leading-tight text-ink">
            You already have {prompt?.activeCount ?? 0} active priorities.
          </DialogTitle>
          <DialogDescription className="text-base text-ink-soft">
            {picking ? `${verb} which one?` : "What will this replace?"}
          </DialogDescription>
        </DialogHeader>

        {picking ? (
          <div className="space-y-2">
            {prompt?.active.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={pending}
                className={cn(optionClass, picking === "kill" && "text-ember")}
                onClick={() => onChoose({ kind: picking, projectId: p.id })}
              >
                {p.name}
              </button>
            ))}
            <Button variant="ghost" size="full" onClick={() => setPicking(null)} disabled={pending}>
              Back
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <button type="button" className={optionClass} disabled={pending} onClick={() => setPicking("finish")}>
              Finish one first
            </button>
            <button type="button" className={optionClass} disabled={pending} onClick={() => setPicking("pause")}>
              Pause one
            </button>
            <button type="button" className={optionClass} disabled={pending} onClick={() => setPicking("kill")}>
              Kill one
            </button>
            <button type="button" className={optionClass} disabled={pending} onClick={() => onChoose({ kind: "park" })}>
              {fromIdea ? "Park this idea" : "Park this"}
            </button>
            <button
              type="button"
              className={cn(optionClass, "bg-transparent text-ink-soft hover:bg-surface-raised")}
              disabled={pending}
              onClick={() => onChoose({ kind: "override" })}
            >
              Override and add anyway
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
