"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { TextField, FormError } from "@/components/forms/field";
import { Group, EmptyState } from "@/components/layout/section";
import {
  addIdentityStatementAction,
  deleteIdentityStatementAction,
  setPrimaryIdentityStatementAction,
  updateIdentityStatementAction,
} from "@/lib/account/actions";
import type { ActionState } from "@/lib/auth/schemas";
import type { IdentityStatementRow } from "@/lib/supabase/types";

const initial: ActionState = {};

interface IdentityListProps {
  statements: IdentityStatementRow[];
}

export function IdentityList({ statements }: IdentityListProps) {
  return (
    <div className="space-y-8">
      {statements.length === 0 ? (
        <EmptyState>Write the first sentence about the man you are becoming.</EmptyState>
      ) : (
        <Group>
          {statements.map((s) => (
            <IdentityRow key={s.id} statement={s} />
          ))}
        </Group>
      )}
      <AddStatementForm />
    </div>
  );
}

function IdentityRow({ statement }: { statement: IdentityStatementRow }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction, saving] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await updateIdentityStatementAction(prev, formData);
    if (result.ok) setEditing(false);
    return result;
  }, initial);
  const fe = state.fieldErrors ?? {};

  function makePrimary() {
    setError(null);
    startTransition(async () => {
      const result = await setPrimaryIdentityStatementAction(statement.id);
      if (result.error) setError(result.error);
    });
  }

  function remove() {
    if (!confirm("Delete this statement?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteIdentityStatementAction(statement.id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <form action={formAction} className="space-y-3 p-4" noValidate>
        <input type="hidden" name="id" value={statement.id} />
        <FormError message={state.error} />
        <TextField
          label="Statement"
          name="body"
          id={`statement-${statement.id}`}
          defaultValue={statement.body}
          maxLength={200}
          className="min-h-20"
          error={fe.body}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <p className="font-display text-lg text-ink">{statement.body}</p>
      {statement.is_primary ? <p className="text-sm text-ink-soft">Primary. Shown on Today and Vision.</p> : null}
      <div className="-ml-2 flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={pending}>
          Edit
        </Button>
        {!statement.is_primary ? (
          <Button type="button" size="sm" variant="ghost" onClick={makePrimary} disabled={pending}>
            Make primary
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" className="text-ember" onClick={remove} disabled={pending}>
          Delete
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AddStatementForm() {
  const [key, setKey] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await addIdentityStatementAction(prev, formData);
    if (result.ok) setKey((k) => k + 1);
    return result;
  }, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form key={key} action={formAction} className="space-y-4" noValidate>
      <FormError message={state.error} />
      <TextField
        label="Add a statement"
        name="body"
        id="new-statement"
        placeholder="I am a man who finishes what he starts."
        maxLength={200}
        className="min-h-20"
        hint="Start with “I am”. Present tense. One sentence."
        error={fe.body}
      />
      <Button type="submit" size="full" variant="secondary" disabled={pending}>
        {pending ? "Adding" : "Add statement"}
      </Button>
    </form>
  );
}
