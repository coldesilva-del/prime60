"use client";

import { useActionState } from "react";
import { Field, FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { startCycleAction } from "@/lib/cycles/actions";
import type { ActionState } from "@/lib/auth/schemas";

interface StartCycleFormProps {
  defaultStartsOn: string;
  fromCycleId: number | null;
  carriedCount: number;
}

export function StartCycleForm({ defaultStartsOn, fromCycleId, carriedCount }: StartCycleFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(startCycleAction, {});
  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />
      <Field
        label="Starts on"
        name="startsOn"
        type="date"
        defaultValue={defaultStartsOn}
        required
        hint="The cycle runs 90 days from this date."
        error={state.fieldErrors?.startsOn}
      />
      {fromCycleId ? <input type="hidden" name="fromCycleId" value={fromCycleId} /> : null}
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Starting" : fromCycleId && carriedCount > 0 ? "Start the next cycle" : "Start the cycle"}
      </Button>
    </form>
  );
}
