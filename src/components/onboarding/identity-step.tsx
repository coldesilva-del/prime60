"use client";

import { useActionState, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Field, FormError, TextField } from "@/components/forms/field";
import { StepActions, StepNote, StepShell } from "@/components/onboarding/step-shell";
import { saveIdentityStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";
import type { HealthTargetsRow, ProfileRow } from "@/lib/supabase/types";
import { cn } from "cn";

type HealthMode = ProfileRow["health_mode"];

interface IdentityStepProps {
  initialStatement: string;
  examples: string[];
  initialHealthMode: HealthMode;
  targets: Pick<HealthTargetsRow, "starting_weight" | "target_weight" | "target_body_fat_low" | "target_body_fat_high"> | null;
}

const initial: ActionState = {};

const MODES: { value: HealthMode; title: string; description: string }[] = [
  { value: "track", title: "Track here", description: "Log sleep, energy, training, weight and more in Prime 60." },
  { value: "coached", title: "I'm coached elsewhere", description: "Keep it light: trained, logged with coach, energy, and a weekly weigh-in." },
];

function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function IdentityStep({ initialStatement, examples, initialHealthMode, targets }: IdentityStepProps) {
  const [state, action, pending] = useActionState(saveIdentityStep, initial);
  const fe = state.fieldErrors ?? {};
  const [statement, setStatement] = useState(initialStatement);
  const [mode, setMode] = useState<HealthMode>(initialHealthMode);
  const hasTargets = Boolean(
    targets && (targets.starting_weight ?? targets.target_weight ?? targets.target_body_fat_low ?? targets.target_body_fat_high) !== null,
  );
  const [showTargets, setShowTargets] = useState(hasTargets);

  return (
    <StepShell
      title="Who are you becoming?"
      lede="One sentence you will read every morning. Then choose how you want to handle health."
    >
      <form action={action} className="space-y-6" noValidate>
        <FormError message={state.error} />

        <div className="space-y-3">
          <TextField
            label="Identity statement"
            name="statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="I am a man who..."
            rows={3}
            autoCapitalize="sentences"
            className="[&_textarea]:font-display [&_textarea]:text-lg"
            error={fe.statement}
          />
          {examples.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-ink-soft">Or start from one of these.</p>
              <ul className="flex flex-wrap gap-2" aria-label="Example statements">
                {examples.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => setStatement(example)}
                      className="min-h-11 rounded-full border border-hairline bg-surface px-4 py-2 text-left text-sm text-ink outline-none transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Health</legend>
          <input type="hidden" name="healthMode" value={mode} />
          <div role="radiogroup" aria-label="Health mode" className="grid gap-3">
            {MODES.map((option) => {
              const on = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setMode(option.value)}
                  className={cn(
                    "min-h-[72px] rounded-[16px] border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    on ? "border-harbour bg-harbour-soft" : "border-hairline bg-surface hover:bg-surface-raised",
                  )}
                >
                  <span className="block text-base font-medium text-ink">{option.title}</span>
                  <span className="block text-sm text-ink-soft">{option.description}</span>
                </button>
              );
            })}
          </div>
          {fe.healthMode ? <StepNote tone="error">{fe.healthMode}</StepNote> : null}
        </fieldset>

        <div className="overflow-hidden rounded-[16px] bg-surface">
          <button
            type="button"
            aria-expanded={showTargets}
            onClick={() => setShowTargets((v) => !v)}
            className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-ink outline-none hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            Add a starting point (optional)
            <ChevronDown
              className={cn("size-5 shrink-0 text-ink-soft transition-transform duration-150", showTargets && "rotate-180")}
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
          <div className={cn("space-y-4 border-t border-hairline px-4 pb-4 pt-3", !showTargets && "hidden")}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Starting weight (kg)"
                name="startingWeight"
                type="number"
                inputMode="decimal"
                step="0.1"
                defaultValue={num(targets?.starting_weight)}
                error={fe.startingWeight}
              />
              <Field
                label="Target weight (kg)"
                name="targetWeight"
                type="number"
                inputMode="decimal"
                step="0.1"
                defaultValue={num(targets?.target_weight)}
                error={fe.targetWeight}
              />
              <Field
                label="Body fat low (%)"
                name="targetBodyFatLow"
                type="number"
                inputMode="decimal"
                step="0.1"
                defaultValue={num(targets?.target_body_fat_low)}
                error={fe.targetBodyFatLow}
              />
              <Field
                label="Body fat high (%)"
                name="targetBodyFatHigh"
                type="number"
                inputMode="decimal"
                step="0.1"
                defaultValue={num(targets?.target_body_fat_high)}
                error={fe.targetBodyFatHigh}
              />
            </div>
            <p className="text-sm text-ink-soft">Progress toward these shows on Health. Change them any time in settings.</p>
          </div>
        </div>

        <StepActions step={9} pending={pending} continueLabel="Finish and open Today" pendingLabel="Finishing" />
      </form>
    </StepShell>
  );
}
