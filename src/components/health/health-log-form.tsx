"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormError, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RatingRow } from "@/components/ui/rating-row";
import { saveHealthLogAction } from "@/lib/health/actions";
import { HEALTH_FIELD_LABEL, isHidden, type HealthField } from "@/lib/health/progress";
import type { HealthMetricRow } from "@/lib/supabase/types";

interface HealthLogFormProps {
  date: string;
  today: string;
  hiddenFields: string[];
  initial: HealthMetricRow | null;
}

const NUMBER_FIELDS: { key: HealthField; step: string; inputMode: "decimal" | "numeric" }[] = [
  { key: "weight", step: "0.1", inputMode: "decimal" },
  { key: "body_fat", step: "0.1", inputMode: "decimal" },
  { key: "waist", step: "0.5", inputMode: "decimal" },
  { key: "sleep_hours", step: "0.5", inputMode: "decimal" },
  { key: "steps", step: "1", inputMode: "numeric" },
  { key: "calories", step: "1", inputMode: "numeric" },
  { key: "protein", step: "1", inputMode: "numeric" },
  { key: "cardio_calories", step: "1", inputMode: "numeric" },
];

/** Track mode. A chosen date, optional fields, one Save. */
export function HealthLogForm({ date, today, hiddenFields, initial }: HealthLogFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveHealthLogAction, {});
  const [sleepQuality, setSleepQuality] = useState<number | null>(initial?.sleep_quality ?? null);
  const [training, setTraining] = useState<number | null>(initial?.training_performance ?? null);

  const show = (f: HealthField) => !isHidden(f, hiddenFields);
  const value = (f: HealthField) => {
    const v = initial?.[f];
    return v === null || v === undefined ? "" : String(v);
  };

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={date}
          max={today}
          onChange={(e) => {
            const next = e.target.value;
            if (next && next <= today) router.replace(`/progress/health/log?date=${next}`);
          }}
        />
        {state.fieldErrors?.date ? <p className="text-sm text-ember">{state.fieldErrors.date}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {NUMBER_FIELDS.filter((f) => show(f.key)).map((f) => (
          <Field
            key={f.key}
            name={f.key}
            label={HEALTH_FIELD_LABEL[f.key]}
            type="number"
            step={f.step}
            inputMode={f.inputMode}
            defaultValue={value(f.key)}
            error={state.fieldErrors?.[f.key]}
          />
        ))}
      </div>

      {show("sleep_quality") ? (
        <RatingRow name="sleep_quality" label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} />
      ) : null}
      {show("training_performance") ? (
        <RatingRow name="training_performance" label="Training performance" value={training} onChange={setTraining} />
      ) : null}

      {show("notes") ? (
        <TextField name="notes" label="Notes" defaultValue={initial?.notes ?? ""} error={state.fieldErrors?.notes} className="[&_textarea]:min-h-20" />
      ) : null}

      <FormError message={state.error} />
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
