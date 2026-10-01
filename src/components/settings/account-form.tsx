"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/forms/field";
import { SelectField } from "@/components/settings/select-field";
import { updateProfileAction } from "@/lib/account/actions";
import { TIMEZONE_GROUPS, TIMEZONE_IDS } from "@/lib/account/timezones";
import type { ActionState } from "@/lib/auth/schemas";
import type { ProfileRow } from "@/lib/supabase/types";

const initial: ActionState = {};

interface AccountFormProps {
  profile: Pick<ProfileRow, "first_name" | "timezone" | "target_year" | "birth_year">;
}

export function AccountForm({ profile }: AccountFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);
  const fe = state.fieldErrors ?? {};
  const [timezone, setTimezone] = useState(profile.timezone);
  const [detected, setDetected] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  function detect() {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zone) {
        setTimezone(zone);
        setDetected(zone);
      }
    } catch {
      // Leave the current value.
    }
  }

  const extraZone = timezone && !TIMEZONE_IDS.includes(timezone) ? timezone : null;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={state.error} />
      {state.ok ? (
        <p className="rounded-[10px] bg-harbour-soft px-4 py-3 text-sm text-ink" role="status">
          Saved.
        </p>
      ) : null}
      <Field
        label="First name"
        name="firstName"
        autoComplete="given-name"
        defaultValue={profile.first_name ?? ""}
        error={fe.firstName}
        required
      />
      <SelectField
        label="Timezone"
        name="timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        error={fe.timezone}
        hint={detected ? `Detected ${detected}.` : "Your day starts and ends in this zone."}
        labelAction={
          <button
            type="button"
            onClick={detect}
            className="inline-flex h-11 items-center px-2 text-sm font-medium text-harbour underline-offset-4 hover:underline"
          >
            Detect
          </button>
        }
      >
        {extraZone ? (
          <optgroup label="Detected">
            <option value={extraZone}>{extraZone}</option>
          </optgroup>
        ) : null}
        {TIMEZONE_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>
      <Field
        label="Prime Self year"
        name="targetYear"
        type="number"
        inputMode="numeric"
        min={currentYear}
        max={currentYear + 30}
        defaultValue={profile.target_year ?? currentYear + 5}
        hint="The year you are building toward. Five years out by default."
        error={fe.targetYear}
        required
      />
      <Field
        label="Birth year"
        name="birthYear"
        type="number"
        inputMode="numeric"
        min={1920}
        max={currentYear - 16}
        defaultValue={profile.birth_year ?? ""}
        hint="Optional. Lets Vision say how old you will be."
        error={fe.birthYear}
      />
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
