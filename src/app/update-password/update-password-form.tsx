"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/forms/field";
import { updatePasswordAction } from "@/lib/auth/actions";
import type { ActionState } from "@/lib/auth/schemas";

const initial: ActionState = {};

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={fe.password}
        required
      />
      <Field
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        error={fe.confirm}
        required
      />
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save new password"}
      </Button>
    </form>
  );
}
