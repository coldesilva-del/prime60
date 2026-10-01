"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Group } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPersonAction, renameGroupAction } from "@/lib/relationships/actions";
import type { GroupWithPeople } from "@/lib/relationships/queries";
import type { ActionState } from "@/lib/relationships/schemas";
import { PersonRow } from "./person-row";

interface GroupSectionProps {
  group: GroupWithPeople;
  today: string;
}

/** A group heading you can rename in place, its people, and an add control. */
export function GroupSection({ group, today }: GroupSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <GroupLabel id={group.id} label={group.label} />
        <AddPerson groupId={group.id} groupLabel={group.label} />
      </div>
      {group.people.length === 0 ? (
        <p className="text-sm text-ink-faint">No one here yet.</p>
      ) : (
        <Group>
          {group.people.map((p) => (
            <PersonRow
              key={p.id}
              id={p.id}
              name={p.name}
              cadenceDays={p.cadenceDays}
              lastOn={p.lastOn}
              connectedToday={p.connectedToday}
              today={today}
            />
          ))}
        </Group>
      )}
    </section>
  );
}

function GroupLabel({ id, label }: { id: number; label: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [shown, setShown] = useState(label);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  function commit() {
    const next = value.trim();
    setEditing(false);
    if (!next || next === shown) {
      setValue(shown);
      return;
    }
    setShown(next);
    start(async () => {
      const result = await renameGroupAction(id, next);
      if (result.error) {
        setShown(label);
        setValue(label);
      }
    });
  }

  if (editing) {
    return (
      <Input
        ref={ref}
        value={value}
        aria-label="Group name"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setValue(shown);
            setEditing(false);
          }
        }}
        className="h-11 max-w-[220px] text-sm font-medium"
        maxLength={40}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={pending}
      aria-label={`Rename ${shown}`}
      className="-ml-2 inline-flex h-11 items-center rounded-[8px] px-2 text-sm font-medium text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {shown}
    </button>
  );
}

function AddPerson({ groupId, groupLabel }: { groupId: number; groupLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await addPersonAction(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    {} as ActionState,
  );

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`Add a person to ${groupLabel}`}>
        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
        Add
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-start gap-2">
      <input type="hidden" name="group_id" value={groupId} />
      <div className="space-y-1">
        <Input
          name="name"
          placeholder="Name"
          aria-label={`Name of the person to add to ${groupLabel}`}
          autoFocus
          maxLength={80}
          className="h-11 w-40 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {state.fieldErrors?.name ? <p className="text-xs text-ember">{state.fieldErrors.name}</p> : null}
        {state.error ? <p className="text-xs text-ember">{state.error}</p> : null}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        Add
      </Button>
    </form>
  );
}
