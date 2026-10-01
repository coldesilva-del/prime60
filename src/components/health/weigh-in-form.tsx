"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveWeighInAction } from "@/lib/health/actions";

interface WeighInFormProps {
  date: string;
  today: string;
  initial: { weight: number | null; body_fat: number | null };
}

/** Coached mode: the weekly reading is weight and body fat only. */
export function WeighInForm({ date, today, initial }: WeighInFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveWeighInAction, {});

  return (
    <form action={action} className="space-y-6">
      <p className="text-base text-ink-soft">Your coach holds the detail. This is the weekly reading.</p>

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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          name="weight"
          label="Weight (kg)"
          type="number"
          step="0.1"
          inputMode="decimal"
          defaultValue={initial.weight ?? ""}
          error={state.fieldErrors?.weight}
        />
        <Field
          name="body_fat"
          label="Body fat (%)"
          type="number"
          step="0.1"
          inputMode="decimal"
          defaultValue={initial.body_fat ?? ""}
          error={state.fieldErrors?.body_fat}
        />
      </div>

      <FormError message={state.error} />
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
