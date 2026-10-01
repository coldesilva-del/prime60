"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/forms/field";
import { EmptyState, Group, Hairline, Section } from "@/components/layout/section";
import {
  addHabitStackAction,
  moveHabitStackAction,
  setHabitStackActiveAction,
  updateHabitStackAction,
} from "@/lib/patterns/habit-stacks/actions";
import { MAX_ACTIVE_STACKS } from "@/lib/patterns/habit-stacks/schemas";
import type { ActionState } from "@/lib/patterns/schemas";
import type { HabitStackRow } from "@/lib/supabase/types";

const initial: ActionState = {};

interface HabitStackSettingsProps {
  stacks: HabitStackRow[];
}

/** "After [anchor] I will [behaviour]". Up to eight active, reorderable. */
export function HabitStackSettings({ stacks }: HabitStackSettingsProps) {
  const active = stacks.filter((s) => s.is_active);
  const inactive = stacks.filter((s) => !s.is_active);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <Section title="Active" description={`${active.length} of ${MAX_ACTIVE_STACKS}. Shown on Today in this order.`}>
        {error ? (
          <p className="text-sm text-ember" role="alert">
            {error}
          </p>
        ) : null}
        {active.length ? (
          <Group>
            {active.map((s, i) => (
              <StackRow key={s.id} stack={s} first={i === 0} last={i === active.length - 1} onError={setError} />
            ))}
          </Group>
        ) : (
          <EmptyState>No stacks yet. Add one below.</EmptyState>
        )}
      </Section>

      <Hairline />

      <Section title="Add a stack">
        <AddStackForm atLimit={active.length >= MAX_ACTIVE_STACKS} />
      </Section>

      {inactive.length ? (
        <>
          <Hairline />
          <Section title="Inactive">
            <Group>
              {inactive.map((s) => (
                <StackRow key={s.id} stack={s} first last onError={setError} />
              ))}
            </Group>
          </Section>
        </>
      ) : null}
    </div>
  );
}

function AddStackForm({ atLimit }: { atLimit: boolean }) {
  const [state, formAction, pending] = useActionState(addHabitStackAction, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate key={state.ok ? "reset" : "form"}>
      <FormError message={state.error} />
      <div className="space-y-1.5">
        <Label htmlFor="stack-anchor">After</Label>
        <Input
          id="stack-anchor"
          name="anchor"
          placeholder="I pour my morning coffee"
          maxLength={160}
          autoComplete="off"
          aria-invalid={fe.anchor ? true : undefined}
        />
        {fe.anchor ? (
          <p className="text-sm text-ember" role="alert">
            {fe.anchor}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stack-behaviour">I will</Label>
        <Input
          id="stack-behaviour"
          name="behaviour"
          placeholder="write the one thing to finish today"
          maxLength={160}
          autoComplete="off"
          aria-invalid={fe.behaviour ? true : undefined}
        />
        {fe.behaviour ? (
          <p className="text-sm text-ember" role="alert">
            {fe.behaviour}
          </p>
        ) : null}
      </div>
      {atLimit ? <p className="text-sm text-ink-soft">Eight is the limit. Deactivate one to add another.</p> : null}
      <Button type="submit" size="full" disabled={pending || atLimit}>
        {pending ? "Adding" : "Add stack"}
      </Button>
    </form>
  );
}

function StackRow({
  stack,
  first,
  last,
  onError,
}: {
  stack: HabitStackRow;
  first: boolean;
  last: boolean;
  onError: (m: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [anchor, setAnchor] = useState(stack.anchor);
  const [behaviour, setBehaviour] = useState(stack.behaviour);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<ActionState>) {
    onError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) onError(res.error);
      else if (res.fieldErrors) onError(Object.values(res.fieldErrors)[0] ?? "Check the fields.");
      else setEditing(false);
    });
  }

  if (editing) {
    return (
      <form
        className="space-y-3 px-4 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateHabitStackAction({ id: stack.id, anchor, behaviour }));
        }}
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor={`anchor-${stack.id}`}>After</Label>
          <Input id={`anchor-${stack.id}`} value={anchor} onChange={(e) => setAnchor(e.target.value)} maxLength={160} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`behaviour-${stack.id}`}>I will</Label>
          <Input
            id={`behaviour-${stack.id}`}
            value={behaviour}
            onChange={(e) => setBehaviour(e.target.value)}
            maxLength={160}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving" : "Save"}
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <p className="min-w-0 flex-1 text-base text-ink">
        <span className="text-ink-soft">After</span> {stack.anchor} <span className="text-ink-soft">I will</span>{" "}
        {stack.behaviour}
      </p>
      {stack.is_active ? (
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-label="Move up"
            disabled={pending || first}
            onClick={() => run(() => moveHabitStackAction({ id: stack.id, direction: "up" }))}
            className="inline-flex size-9 items-center justify-center rounded-[8px] text-ink-soft hover:bg-surface-raised disabled:opacity-30"
          >
            <ChevronUp className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={pending || last}
            onClick={() => run(() => moveHabitStackAction({ id: stack.id, direction: "down" }))}
            className="inline-flex size-9 items-center justify-center rounded-[8px] text-ink-soft hover:bg-surface-raised disabled:opacity-30"
          >
            <ChevronDown className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="flex shrink-0 flex-col items-end">
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-soft"
          disabled={pending}
          onClick={() => run(() => setHabitStackActiveAction({ id: stack.id, active: !stack.is_active }))}
        >
          {stack.is_active ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </div>
  );
}
