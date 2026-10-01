"use client";

import { useActionState, useState } from "react";
import { FormError, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { ExampleBlock } from "@/components/onboarding/example-block";
import { StepActions, StepShell } from "@/components/onboarding/step-shell";
import { saveLifestyleStep, skipLifestyleStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";

interface LifestyleStepProps {
  initialLifestyle: string;
  initialMoment: string;
  lifestyleExample: string;
  momentExample: string;
}

const initial: ActionState = {};

export function LifestyleStep({ initialLifestyle, initialMoment, lifestyleExample, momentExample }: LifestyleStepProps) {
  const [state, action, pending] = useActionState(saveLifestyleStep, initial);
  const [skipState, skipAction, skipping] = useActionState(() => skipLifestyleStep(), initial);
  const fe = state.fieldErrors ?? {};
  const [lifestyle, setLifestyle] = useState(initialLifestyle);
  const [moment, setMoment] = useState(initialMoment);

  return (
    <StepShell
      title="Lifestyle and Your Moment"
      lede="Optional. Where you live, how you travel, what a good week looks like. Then one scene from that life, as if you were in it."
    >
      <form id="skip-lifestyle" action={skipAction} />
      <form action={action} className="space-y-6" noValidate>
        <FormError message={state.error ?? skipState.error} />
        <div className="space-y-4">
          <TextField
            label="Lifestyle"
            name="lifestyle"
            value={lifestyle}
            onChange={(e) => setLifestyle(e.target.value)}
            placeholder="In that year I live... I travel... A good week includes..."
            rows={5}
            autoCapitalize="sentences"
            className="[&_textarea]:font-display [&_textarea]:text-lg"
            error={fe.lifestyle}
          />
          <ExampleBlock example={lifestyleExample} onUse={setLifestyle} summary="See a lifestyle example" />
        </div>
        <div className="space-y-4">
          <TextField
            label="Your Moment"
            name="moment"
            value={moment}
            onChange={(e) => setMoment(e.target.value)}
            placeholder="I am sitting... Beside me... I feel..."
            rows={5}
            autoCapitalize="sentences"
            className="[&_textarea]:font-display [&_textarea]:text-lg"
            error={fe.moment}
          />
          <ExampleBlock example={momentExample} onUse={setMoment} summary="See the Amalfi example" />
        </div>
        <StepActions
          step={5}
          pending={pending}
          secondary={
            <Button type="submit" form="skip-lifestyle" variant="ghost" size="sm" disabled={skipping || pending}>
              {skipping ? "Skipping" : "Skip for now"}
            </Button>
          }
        />
      </form>
    </StepShell>
  );
}
