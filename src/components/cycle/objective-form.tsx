"use client";

import { useActionState, useState } from "react";
import { cn } from "cn";
import { Field, FormError, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveObjectiveAction } from "@/lib/cycles/actions";
import { MAX_OBJECTIVES, PILLAR_GUIDELINES, PILLAR_LABELS, PILLAR_ORDER } from "@/lib/cycles/dates";
import { OBJECTIVE_STATUSES, STATUS_LABELS } from "@/lib/cycles/schemas";
import type { ActionState } from "@/lib/auth/schemas";
import type { ObjectiveRow, Pillar } from "@/lib/supabase/types";

interface ObjectiveFormProps {
  objective: ObjectiveRow | null;
  /** Objectives already in the cycle, per pillar, for the guideline text. */
  counts: Record<Pillar, number>;
  total: number;
}

export function ObjectiveForm({ objective, counts, total }: ObjectiveFormProps) {
  const action = saveObjectiveAction.bind(null, objective?.id ?? null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [pillar, setPillar] = useState<Pillar>(objective?.pillar ?? "health");
  const [status, setStatus] = useState(objective?.status ?? "on_track");
  const errors = state.fieldErrors ?? {};
  const guide = PILLAR_GUIDELINES[pillar];
  const already = counts[pillar] - (objective?.pillar === pillar ? 1 : 0);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <div className="space-y-2">
        <Label id="pillar-label">Pillar</Label>
        <div role="radiogroup" aria-labelledby="pillar-label" className="grid grid-cols-2 gap-2">
          {PILLAR_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={pillar === p}
              onClick={() => setPillar(p)}
              className={cn(
                "h-12 rounded-[10px] text-[15px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pillar === p ? "bg-harbour text-primary-foreground" : "bg-surface text-ink-soft hover:bg-surface-raised",
              )}
            >
              {PILLAR_LABELS[p]}
            </button>
          ))}
        </div>
        <input type="hidden" name="pillar" value={pillar} />
        <p className="text-sm text-ink-soft">
          Guideline: {guide.text.toLowerCase()} for {PILLAR_LABELS[pillar].toLowerCase()}. You have {already} so far,{" "}
          {total} of {MAX_OBJECTIVES} in the cycle.
        </p>
        {errors.pillar ? <p className="text-sm text-ember">{errors.pillar}</p> : null}
      </div>

      <Field
        label="Outcome"
        name="outcome"
        defaultValue={objective?.outcome ?? ""}
        required
        maxLength={300}
        placeholder="What will be true in 90 days"
        error={errors.outcome}
        autoComplete="off"
      />
      <TextField
        label="Why"
        name="why"
        defaultValue={objective?.why ?? ""}
        className="[&_textarea]:min-h-20"
        hint="The reason that holds when the week gets hard."
        error={errors.why}
      />
      <TextField
        label="Starting point"
        name="startingPoint"
        defaultValue={objective?.starting_point ?? ""}
        className="[&_textarea]:min-h-20"
        error={errors.startingPoint}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Metric" name="metric" defaultValue={objective?.metric ?? ""} maxLength={200} error={errors.metric} autoComplete="off" />
        <Field label="Target" name="target" defaultValue={objective?.target ?? ""} maxLength={200} error={errors.target} autoComplete="off" />
      </div>
      <Field
        label="Leading indicator"
        name="leadingIndicator"
        defaultValue={objective?.leading_indicator ?? ""}
        maxLength={300}
        hint="The weekly behaviour that predicts the outcome."
        error={errors.leadingIndicator}
        autoComplete="off"
      />
      <Field
        label="Next action"
        name="nextAction"
        defaultValue={objective?.next_action ?? ""}
        maxLength={300}
        error={errors.nextAction}
        autoComplete="off"
      />

      {objective ? (
        <div className="space-y-2">
          <Label id="status-label">Status</Label>
          <div role="radiogroup" aria-labelledby="status-label" className="grid grid-cols-2 gap-2">
            {OBJECTIVE_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-12 rounded-[10px] text-[15px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  status === s ? "bg-harbour text-primary-foreground" : "bg-surface text-ink-soft hover:bg-surface-raised",
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <input type="hidden" name="status" value={status} />
        </div>
      ) : (
        <input type="hidden" name="status" value="on_track" />
      )}

      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save objective"}
      </Button>
    </form>
  );
}
