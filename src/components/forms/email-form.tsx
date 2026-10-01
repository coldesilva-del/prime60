"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/forms/field";
import type { ActionState } from "@/lib/auth/schemas";

const initial: ActionState = {};

interface EmailFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  pendingLabel: string;
  defaultEmail?: string;
}

export function EmailForm({ action, submitLabel, pendingLabel, defaultEmail }: EmailFormProps) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={state.error} />
      {state.ok ? (
        <p className="rounded-[10px] bg-harbour-soft px-4 py-3 text-sm text-ink" role="status">
          Sent. Check your inbox.
        </p>
      ) : null}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={defaultEmail}
        error={fe.email}
        required
      />
      <Button type="submit" size="full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
