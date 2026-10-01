"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextField } from "@/components/forms/field";
import { Switch } from "@/components/ui/switch";
import { SelectField } from "@/components/settings/select-field";
import { deleteContentRowAction, saveContentRowAction } from "@/lib/admin/actions";
import type { TableDef } from "@/lib/admin/content-config";
import type { ContentRow } from "@/lib/admin/queries";
import type { ActionState } from "@/lib/auth/schemas";

const initial: ActionState = {};

interface ContentRowFormProps {
  def: TableDef;
  row: ContentRow | null;
}

/** Generic add and edit form driven by the table definition. */
export function ContentRowForm({ def, row }: ContentRowFormProps) {
  const [state, formAction, pending] = useActionState(saveContentRowAction, initial);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const fe = state.fieldErrors ?? {};
  const uid = useId();

  function remove() {
    if (!row || !confirm("Delete this row for everyone?")) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteContentRowAction(def.table, Number(row.id));
      if (result?.error) setDeleteError(result.error);
    });
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="table" value={def.table} />
      <input type="hidden" name="id" value={row ? String(row.id) : ""} />
      <FormError message={state.error} />
      {def.fields.map((f) => {
        const current = row?.[f.name];
        const id = `${uid}-${f.name}`;
        switch (f.kind) {
          case "textarea":
            return (
              <TextField
                key={f.name}
                id={id}
                label={f.label}
                name={f.name}
                defaultValue={current == null ? "" : String(current)}
                hint={f.hint}
                error={fe[f.name]}
                required={f.required}
              />
            );
          case "number":
            return (
              <Field
                key={f.name}
                id={id}
                label={f.label}
                name={f.name}
                type="number"
                inputMode="numeric"
                defaultValue={current == null ? "0" : String(current)}
                hint={f.hint}
                error={fe[f.name]}
                required={f.required}
              />
            );
          case "boolean":
            return (
              <BooleanField
                key={f.name}
                id={id}
                label={f.label}
                name={f.name}
                defaultChecked={current == null ? true : Boolean(current)}
              />
            );
          case "select":
            return (
              <SelectField
                key={f.name}
                id={id}
                label={f.label}
                name={f.name}
                defaultValue={current == null ? "" : String(current)}
                hint={f.hint}
                error={fe[f.name]}
                required={f.required}
              >
                <option value="" disabled>
                  Choose
                </option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            );
          default:
            return (
              <Field
                key={f.name}
                id={id}
                label={f.label}
                name={f.name}
                defaultValue={current == null ? "" : String(current)}
                hint={f.hint}
                error={fe[f.name]}
                required={f.required}
                autoComplete="off"
              />
            );
        }
      })}
      <div className="space-y-2">
        <Button type="submit" size="full" disabled={pending || deleting}>
          {pending ? "Saving" : "Save"}
        </Button>
        {row ? (
          <Button type="button" variant="ghost" size="full" className="text-ember" onClick={remove} disabled={pending || deleting}>
            {deleting ? "Deleting" : "Delete"}
          </Button>
        ) : null}
        {deleteError ? (
          <p className="text-sm text-ember" role="alert">
            {deleteError}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function BooleanField({ id, label, name, defaultChecked }: { id: string; label: string; name: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <Switch id={id} checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}
