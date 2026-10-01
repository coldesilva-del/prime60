"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { FormError } from "@/components/forms/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepActions, StepNote, StepShell } from "@/components/onboarding/step-shell";
import { savePatternsStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";
import { MAX_FOCUS, MIN_FOCUS } from "@/lib/onboarding/steps";
import type { PatternLibraryRow } from "@/lib/supabase/types";
import { cn } from "cn";

export type PatternOverride = { replacement?: string; ifThen?: string };

interface PatternsStepProps {
  patterns: PatternLibraryRow[];
  initialFocusIds: number[];
  initialOverrides: Record<string, PatternOverride>;
}

const initial: ActionState = {};

export function PatternsStep({ patterns, initialFocusIds, initialOverrides }: PatternsStepProps) {
  const [state, action, pending] = useActionState(savePatternsStep, initial);
  const fe = state.fieldErrors ?? {};
  const [focusIds, setFocusIds] = useState<number[]>(initialFocusIds);
  const [overrides, setOverrides] = useState<Record<string, PatternOverride>>(initialOverrides);
  const [limitNote, setLimitNote] = useState<string | null>(null);

  const chosen = new Set(focusIds);

  function toggle(id: number) {
    if (chosen.has(id)) {
      setFocusIds((ids) => ids.filter((x) => x !== id));
      setLimitNote(null);
      return;
    }
    if (focusIds.length >= MAX_FOCUS) {
      setLimitNote(`You have ${MAX_FOCUS} in focus. Remove one to add another.`);
      return;
    }
    setFocusIds((ids) => [...ids, id]);
    setLimitNote(null);
  }

  function setOverride(id: number, key: keyof PatternOverride, value: string) {
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...prev[String(id)], [key]: value } }));
  }

  const payload = JSON.stringify({ focusIds, overrides });
  const count = focusIds.length;
  const countLine =
    count < MIN_FOCUS
      ? `${count} of ${MAX_FOCUS} chosen. Choose at least ${MIN_FOCUS}.`
      : `${count} of ${MAX_FOCUS} chosen.`;

  return (
    <StepShell
      title="Old patterns"
      lede={`Choose between ${MIN_FOCUS} and ${MAX_FOCUS} patterns to keep in focus. Each one comes with a replacement behaviour and an IF-THEN plan you can edit.`}
    >
      <form action={action} className="space-y-5" noValidate>
        <FormError message={state.error} />
        <input type="hidden" name="payload" value={payload} />

        <p className="text-sm text-ink-soft" aria-live="polite">
          {countLine}
        </p>

        <ul className="space-y-3" aria-label="Pattern library">
          {patterns.map((pattern) => {
            const selected = chosen.has(pattern.id);
            const override = overrides[String(pattern.id)] ?? {};
            const replacementId = `replacement-${pattern.id}`;
            const ifThenId = `if-then-${pattern.id}`;
            return (
              <li key={pattern.id} className={cn("overflow-hidden rounded-[16px] bg-surface", selected && "ring-1 ring-harbour")}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(pattern.id)}
                  className={cn(
                    "flex min-h-14 w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    selected ? "bg-harbour-soft" : "hover:bg-surface-raised",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected ? "border-harbour bg-harbour text-primary-foreground" : "border-hairline bg-surface",
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="size-4" strokeWidth={2} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">{pattern.name}</span>
                    <span className="block text-sm text-ink-soft">{pattern.description}</span>
                  </span>
                </button>
                {selected ? (
                  <div className="space-y-4 border-t border-hairline px-4 pb-4 pt-3">
                    <div className="space-y-2">
                      <Label htmlFor={replacementId}>Replacement behaviour</Label>
                      <Textarea
                        id={replacementId}
                        value={override.replacement ?? pattern.replacement}
                        onChange={(e) => setOverride(pattern.id, "replacement", e.target.value)}
                        rows={2}
                        className="min-h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={ifThenId}>IF-THEN plan</Label>
                      <Textarea
                        id={ifThenId}
                        value={override.ifThen ?? pattern.if_then}
                        onChange={(e) => setOverride(pattern.id, "ifThen", e.target.value)}
                        rows={3}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {limitNote ? <StepNote>{limitNote}</StepNote> : null}
        {fe.focusIds ? <StepNote tone="error">{fe.focusIds}</StepNote> : null}
        {fe.overrides ? <StepNote tone="error">{fe.overrides}</StepNote> : null}

        <StepActions step={6} pending={pending} />
      </form>
    </StepShell>
  );
}
