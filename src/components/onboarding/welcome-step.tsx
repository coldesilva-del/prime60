"use client";

import { useActionState, useState } from "react";
import { Field, FormError } from "@/components/forms/field";
import { StepActions, StepShell } from "@/components/onboarding/step-shell";
import { saveWelcomeStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";
import { ageIn } from "@/lib/onboarding/steps";

interface WelcomeStepProps {
  firstName: string;
  targetYear: number;
  birthYear: number | null;
}

const initial: ActionState = {};

function toYear(value: string): number | null {
  if (!/^\d{4}$/.test(value)) return null;
  return Number(value);
}

export function WelcomeStep({ firstName, targetYear, birthYear }: WelcomeStepProps) {
  const [state, action, pending] = useActionState(saveWelcomeStep, initial);
  const fe = state.fieldErrors ?? {};
  const [year, setYear] = useState(String(targetYear));
  const [born, setBorn] = useState(birthYear ? String(birthYear) : "");

  const yearNumber = toYear(year);
  const age = ageIn(yearNumber, toYear(born));

  return (
    <StepShell
      title="Welcome"
      lede="Prime 60 measures today's behaviour against the man you intend to be in five years. Start with the year."
    >
      <form action={action} className="space-y-5" noValidate>
        <FormError message={state.error} />
        <Field
          label="First name"
          name="firstName"
          defaultValue={firstName}
          autoComplete="given-name"
          autoCapitalize="words"
          error={fe.firstName}
          required
        />
        <Field
          label="Target year"
          name="targetYear"
          type="number"
          inputMode="numeric"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          hint="The year your Prime Self lives in. Five years out is the default."
          error={fe.targetYear}
          required
        />
        <Field
          label="Birth year (optional)"
          name="birthYear"
          type="number"
          inputMode="numeric"
          value={born}
          onChange={(e) => setBorn(e.target.value)}
          placeholder="1968"
          hint="Lets us say how old you will be."
          error={fe.birthYear}
        />

        {yearNumber ? (
          <p className="font-display text-xl text-ink" aria-live="polite">
            {age ? `In ${yearNumber} you will be ${age}. Who is he?` : `Who is the man you will be in ${yearNumber}?`}
          </p>
        ) : null}

        <StepActions step={1} pending={pending} />
      </form>
    </StepShell>
  );
}
