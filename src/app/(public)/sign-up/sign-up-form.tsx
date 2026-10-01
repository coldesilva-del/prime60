"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/forms/field";
import { signUpAction } from "@/lib/auth/actions";
import type { ActionState } from "@/lib/auth/schemas";

const initial: ActionState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <Field
        label="First name"
        name="firstName"
        autoComplete="given-name"
        autoCapitalize="words"
        error={fe.firstName}
        required
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={fe.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters."
        error={fe.password}
        required
      />

      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-0.5 size-5 shrink-0 rounded border-hairline accent-harbour"
            aria-invalid={fe.acceptTerms ? true : undefined}
          />
          <span>
            I accept the{" "}
            <Link href="/terms" className="text-harbour underline-offset-4 hover:underline">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-harbour underline-offset-4 hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {fe.acceptTerms ? (
          <p className="text-sm text-ember" role="alert">
            {fe.acceptTerms}
          </p>
        ) : null}
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="marketingConsent"
            className="mt-0.5 size-5 shrink-0 rounded border-hairline accent-harbour"
          />
          <span>Send me occasional emails from Colin about Prime 60. Unsubscribe any time.</span>
        </label>
      </div>

      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Creating your account" : "Create account"}
      </Button>
    </form>
  );
}
