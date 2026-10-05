"use client";

import { useActionState, useState } from "react";
import { FormError, TextField } from "@/components/forms/field";
import { ExampleBlock } from "@/components/onboarding/example-block";
import { StepActions, StepShell } from "@/components/onboarding/step-shell";
import { saveHealthStep, savePurposeStep, saveRelationshipsStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";

type NorthStarStepNumber = 2 | 3 | 4;

const ACTIONS: Record<NorthStarStepNumber, (prev: ActionState, formData: FormData) => Promise<ActionState>> = {
  2: saveHealthStep,
  3: savePurposeStep,
  4: saveRelationshipsStep,
};

const COPY: Record<NorthStarStepNumber, { title: string; lede: string; label: string; placeholder: string }> = {
  2: {
    title: "Your health North Star",
    lede: "Describe the body, energy and physical life of the man in your target year. Present tense. Speak it if that is easier than typing.",
    label: "Health",
    placeholder: "In that year I weigh... I train... I sleep... People notice...",
  },
  3: {
    title: "Your purpose North Star",
    lede: "Describe the work you do, who it serves and what it gives you. Present tense.",
    label: "Purpose",
    placeholder: "In that year my work is... It serves... Income comes from...",
  },
  4: {
    title: "Your relationships North Star",
    lede: "Describe your partner, children, family and friends in that year, and how they feel about you.",
    label: "Relationships",
    placeholder: "In that year my partner and I... My children... My friends...",
  },
};

interface NorthStarStepProps {
  step: NorthStarStepNumber;
  initialBody: string;
  examples: string[];
}

const initial: ActionState = {};

export function NorthStarStep({ step, initialBody, examples }: NorthStarStepProps) {
  const [state, action, pending] = useActionState(ACTIONS[step], initial);
  const fe = state.fieldErrors ?? {};
  const [body, setBody] = useState(initialBody);
  const copy = COPY[step];

  return (
    <StepShell title={copy.title} lede={copy.lede}>
      <form action={action} className="space-y-5" noValidate>
        <FormError message={state.error} />
        <TextField
          label={copy.label}
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={copy.placeholder}
          rows={7}
          autoCapitalize="sentences"
          className="[&_textarea]:font-display [&_textarea]:text-lg"
          error={fe.body}
        />
        <ExampleBlock examples={examples} onUse={setBody} />
        <StepActions step={step} pending={pending} />
      </form>
    </StepShell>
  );
}
