"use client";

import { useActionState, useState } from "react";
import { Field, FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updatePersonAction } from "@/lib/relationships/actions";
import { CADENCE_OPTIONS, cadenceWords } from "@/lib/relationships/drift";

interface PersonSettingsProps {
  id: number;
  name: string;
  cadenceDays: number;
  isActive: boolean;
}

const selectClass =
  "flex h-12 w-full appearance-none rounded-[10px] border border-hairline bg-surface px-4 text-base text-ink outline-none focus-visible:border-harbour focus-visible:ring-2 focus-visible:ring-harbour/30";

export function PersonSettings({ id, name, cadenceDays, isActive }: PersonSettingsProps) {
  const [state, action, pending] = useActionState(updatePersonAction, {});
  const [active, setActive] = useState(isActive);
  const options = CADENCE_OPTIONS.some((o) => o.value === cadenceDays)
    ? CADENCE_OPTIONS
    : [...CADENCE_OPTIONS, { value: cadenceDays, label: cadenceWords(cadenceDays) }];

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field name="name" label="Name" defaultValue={name} maxLength={80} error={state.fieldErrors?.name} />
      <div className="space-y-2">
        <Label htmlFor="cadence_days">Cadence</Label>
        <select id="cadence_days" name="cadence_days" defaultValue={String(cadenceDays)} className={selectClass}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex min-h-12 items-center justify-between gap-4 text-base text-ink">
        Active
        <Switch checked={active} onCheckedChange={setActive} aria-label="Active" />
      </label>
      <input type="hidden" name="is_active" value={active ? "true" : "false"} />
      <FormError message={state.error} />
      {state.ok ? (
        <p className="text-sm text-ink-soft" role="status">
          Saved.
        </p>
      ) : null}
      <Button type="submit" variant="secondary" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
