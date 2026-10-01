"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/forms/field";
import { SelectField } from "@/components/settings/select-field";
import { updatePreferencesAction } from "@/lib/account/actions";
import type { ActionState } from "@/lib/auth/schemas";
import type { ProfileRow } from "@/lib/supabase/types";

const initial: ActionState = {};

const HOURS = Array.from({ length: 24 }, (_, h) => {
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return { value: h, label: `${twelve}:00 ${suffix}` };
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface PreferencesFormProps {
  profile: Pick<ProfileRow, "evening_hour" | "weigh_in_dow" | "active_project_limit">;
}

export function PreferencesForm({ profile }: PreferencesFormProps) {
  const [state, formAction, pending] = useActionState(updatePreferencesAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={state.error} />
      {state.ok ? (
        <p className="rounded-[10px] bg-harbour-soft px-4 py-3 text-sm text-ink" role="status">
          Saved.
        </p>
      ) : null}
      <SelectField
        label="Evening check-in from"
        name="eveningHour"
        defaultValue={profile.evening_hour}
        hint="Today switches to the evening check-in from this hour."
        error={fe.eveningHour}
      >
        {HOURS.map((h) => (
          <option key={h.value} value={h.value}>
            {h.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Weigh-in day"
        name="weighInDow"
        defaultValue={profile.weigh_in_dow}
        hint="Today asks for your weight once a week on this day."
        error={fe.weighInDow}
      >
        {DAYS.map((d, i) => (
          <option key={d} value={i}>
            {d}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Active project limit"
        name="activeProjectLimit"
        defaultValue={profile.active_project_limit}
        hint="Starting one more than this asks you to pause or finish something first."
        error={fe.activeProjectLimit}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "project" : "projects"}
          </option>
        ))}
      </SelectField>
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
