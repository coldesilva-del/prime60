"use client";

import { useActionState, useState } from "react";
import { cn } from "cn";
import { FormError, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/cycle/objective-list";
import { closeCycleAction } from "@/lib/cycles/actions";
import { PILLAR_LABELS } from "@/lib/cycles/dates";
import { DECISION_LABELS, END_DECISIONS, type EndDecision } from "@/lib/cycles/schemas";
import type { ActionState } from "@/lib/auth/schemas";
import type { ObjectiveRow } from "@/lib/supabase/types";

interface CloseCycleFormProps {
  objectives: ObjectiveRow[];
}

const DECISION_HINTS: Record<EndDecision, string> = {
  continue: "Carry it into the next cycle as it is.",
  adapt: "Keep the aim, change the approach. Write it fresh next cycle.",
  stop: "Let it go. Stopping is a decision, not a miss.",
  scale: "It worked. Carry it forward and raise the target.",
};

export function CloseCycleForm({ objectives }: CloseCycleFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(closeCycleAction, {});
  const [decisions, setDecisions] = useState<Record<number, EndDecision | null>>(() =>
    Object.fromEntries(objectives.map((o) => [o.id, o.end_decision])),
  );
  const allDecided = objectives.every((o) => decisions[o.id]);

  return (
    <form action={formAction} className="space-y-8">
      <FormError message={state.error} />

      {objectives.length ? (
        <ol className="space-y-6">
          {objectives.map((o) => {
            const chosen = decisions[o.id];
            return (
              <li key={o.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-soft">{PILLAR_LABELS[o.pillar]}</p>
                    <p className="text-base text-ink">{o.outcome}</p>
                  </div>
                  <StatusChip status={o.status} />
                </div>
                <div role="radiogroup" aria-label={`Decision for ${o.outcome}`} className="grid grid-cols-4 gap-1 rounded-[10px] bg-surface p-1">
                  {END_DECISIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="radio"
                      aria-checked={chosen === d}
                      onClick={() => setDecisions((s) => ({ ...s, [o.id]: d }))}
                      className={cn(
                        "h-11 rounded-[8px] text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        chosen === d ? "bg-harbour text-primary-foreground" : "text-ink-soft hover:bg-surface-raised",
                      )}
                    >
                      {DECISION_LABELS[d]}
                    </button>
                  ))}
                </div>
                {chosen ? <p className="text-sm text-ink-soft">{DECISION_HINTS[chosen]}</p> : null}
                <input type="hidden" name={`decision_${o.id}`} value={chosen ?? ""} />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-base text-ink-soft">This cycle has no objectives. Close it and start the next one.</p>
      )}

      <TextField
        label="Closing notes"
        name="closingNotes"
        hint="What this cycle taught you. Optional."
        error={state.fieldErrors?.closingNotes}
      />

      <Button type="submit" size="full" disabled={pending || !allDecided}>
        {pending ? "Closing" : "Close the cycle"}
      </Button>
    </form>
  );
}
