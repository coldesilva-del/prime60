"use client";

import { useActionState, useState } from "react";
import { cn } from "cn";
import { Field, FormError } from "@/components/forms/field";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveHealthSettingsAction } from "@/lib/health/actions";
import { HEALTH_FIELDS, HEALTH_FIELD_LABEL, WEEKDAYS } from "@/lib/health/progress";
import type { HealthTargetsRow } from "@/lib/supabase/types";

interface HealthSettingsFormProps {
  mode: "track" | "coached";
  weighInDow: number;
  targets: Omit<HealthTargetsRow, "user_id" | "updated_at">;
}

const selectClass =
  "flex h-12 w-full appearance-none rounded-[10px] border border-hairline bg-surface px-4 text-base text-ink outline-none focus-visible:border-harbour focus-visible:ring-2 focus-visible:ring-harbour/30";

function str(v: number | null): string {
  return v === null ? "" : String(v);
}

export function HealthSettingsForm({ mode: initialMode, weighInDow, targets }: HealthSettingsFormProps) {
  const [state, action, pending] = useActionState(saveHealthSettingsAction, {});
  const [mode, setMode] = useState<"track" | "coached">(initialMode);
  const errors = state.fieldErrors ?? {};

  const segment =
    "h-12 flex-1 text-[15px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <form action={action} className="space-y-8">
      <Section title="Mode" description="Track here, or let your coach hold the detail and log a weekly reading.">
        <div role="radiogroup" aria-label="Health mode" className="flex overflow-hidden rounded-[10px] border border-hairline bg-surface">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "track"}
            onClick={() => setMode("track")}
            className={cn(segment, mode === "track" ? "bg-harbour text-primary-foreground" : "text-ink-soft hover:bg-surface-raised")}
          >
            Track here
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "coached"}
            onClick={() => setMode("coached")}
            className={cn(
              segment,
              "border-l border-hairline",
              mode === "coached" ? "bg-harbour text-primary-foreground" : "text-ink-soft hover:bg-surface-raised",
            )}
          >
            Coached elsewhere
          </button>
        </div>
        <input type="hidden" name="health_mode" value={mode} />
      </Section>

      {mode === "track" ? (
        <Section title="Hidden fields" description="Tick a field to keep it off the log page.">
          <ul className="divide-y divide-hairline rounded-[16px] bg-surface">
            {HEALTH_FIELDS.map((f) => (
              <li key={f}>
                <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-4 py-2 text-base text-ink">
                  {HEALTH_FIELD_LABEL[f]}
                  <input
                    type="checkbox"
                    name="hidden_fields"
                    value={f}
                    defaultChecked={targets.hidden_fields.includes(f)}
                    className="size-5 accent-harbour"
                  />
                </label>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Targets" description="Progress is direction-aware, so a target above your start reads as rising.">
        <div className="grid grid-cols-2 gap-4">
          <Field name="starting_weight" label="Starting weight (kg)" type="number" step="0.1" inputMode="decimal" defaultValue={str(targets.starting_weight)} error={errors.starting_weight} />
          <Field name="target_weight" label="Target weight (kg)" type="number" step="0.1" inputMode="decimal" defaultValue={str(targets.target_weight)} error={errors.target_weight} />
          <Field name="starting_body_fat" label="Starting body fat (%)" type="number" step="0.1" inputMode="decimal" defaultValue={str(targets.starting_body_fat)} error={errors.starting_body_fat} />
          <div />
          <Field name="target_body_fat_low" label="Body fat band, low (%)" type="number" step="0.1" inputMode="decimal" defaultValue={str(targets.target_body_fat_low)} error={errors.target_body_fat_low} />
          <Field name="target_body_fat_high" label="Body fat band, high (%)" type="number" step="0.1" inputMode="decimal" defaultValue={str(targets.target_body_fat_high)} error={errors.target_body_fat_high} />
        </div>
      </Section>

      <Section title="Programme" description="Per week unless it says otherwise.">
        <div className="grid grid-cols-2 gap-4">
          <Field name="resistance_per_week" label="Resistance sessions" type="number" step="1" inputMode="numeric" defaultValue={str(targets.resistance_per_week)} error={errors.resistance_per_week} />
          <Field name="cardio_per_week" label="Cardio sessions" type="number" step="1" inputMode="numeric" defaultValue={str(targets.cardio_per_week)} error={errors.cardio_per_week} />
          <Field name="cardio_calories_per_session" label="Cardio calories per session" type="number" step="1" inputMode="numeric" defaultValue={str(targets.cardio_calories_per_session)} error={errors.cardio_calories_per_session} />
          <Field name="steps_per_day" label="Steps per day" type="number" step="1" inputMode="numeric" defaultValue={str(targets.steps_per_day)} error={errors.steps_per_day} />
        </div>
      </Section>

      <Section title="Weigh-in day" description="The day Today prompts for a reading.">
        <div className="space-y-2">
          <Label htmlFor="weigh_in_dow">Day</Label>
          <select id="weigh_in_dow" name="weigh_in_dow" defaultValue={String(weighInDow)} className={selectClass}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <FormError message={state.error} />
      {state.ok ? (
        <p className="text-sm text-ink-soft" role="status">
          Saved.
        </p>
      ) : null}
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
