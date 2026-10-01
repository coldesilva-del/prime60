"use client";

import { useActionState, useRef, useState } from "react";
import { X } from "lucide-react";
import { FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepActions, StepNote, StepShell } from "@/components/onboarding/step-shell";
import { savePeopleStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";
import { CADENCE_OPTIONS, type PersonDraft } from "@/lib/onboarding/steps";
import type { GroupKey } from "@/lib/supabase/types";

export type PeopleGroupOption = { key: GroupKey; label: string; cadence: number };

interface PeopleStepProps {
  groups: PeopleGroupOption[];
  initialPeople: PersonDraft[];
}

type Row = PersonDraft & { clientKey: number };

const initial: ActionState = {};
const MAX_PEOPLE = 60;

function cadenceLabel(days: number): string {
  return CADENCE_OPTIONS.find((o) => o.value === days)?.label.toLowerCase() ?? `every ${days} days`;
}

export function PeopleStep({ groups, initialPeople }: PeopleStepProps) {
  const [state, action, pending] = useActionState(savePeopleStep, initial);
  const fe = state.fieldErrors ?? {};
  // Keys for rows added in this session continue after the initial ones. The ref is only touched in event handlers.
  const nextKey = useRef(initialPeople.length);
  const [rows, setRows] = useState<Row[]>(() => initialPeople.map((p, index) => ({ ...p, clientKey: index })));
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function add(group: PeopleGroupOption) {
    const name = (drafts[group.key] ?? "").trim();
    if (!name || rows.length >= MAX_PEOPLE) return;
    if (group.key === "partner" && rows.some((r) => r.group === "partner")) return;
    setRows((prev) => [...prev, { id: null, group: group.key, name, cadenceDays: group.cadence, clientKey: nextKey.current++ }]);
    setDrafts((prev) => ({ ...prev, [group.key]: "" }));
  }

  function remove(clientKey: number) {
    setRows((prev) => prev.filter((r) => r.clientKey !== clientKey));
  }

  function setCadence(clientKey: number, cadenceDays: number) {
    setRows((prev) => prev.map((r) => (r.clientKey === clientKey ? { ...r, cadenceDays } : r)));
  }

  const payload = JSON.stringify({
    people: rows.map(({ id, group, name, cadenceDays }) => ({ id, group, name, cadenceDays })),
  });

  return (
    <StepShell
      title="People"
      lede="The people you intend to stay close to. Each person has a cadence: how often connecting counts as on track."
    >
      <form action={action} className="space-y-6" noValidate>
        <FormError message={state.error} />
        <input type="hidden" name="payload" value={payload} />

        {groups.map((group) => {
          const members = rows.filter((r) => r.group === group.key);
          const inputId = `add-${group.key}`;
          const partnerFull = group.key === "partner" && members.length >= 1;
          return (
            <section key={group.key} className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-base font-medium text-ink">{group.label}</h2>
                <span className="text-sm text-ink-soft">Default {cadenceLabel(group.cadence)}</span>
              </div>

              {members.length > 0 ? (
                <ul className="divide-y divide-hairline overflow-hidden rounded-[16px] bg-surface">
                  {members.map((person) => {
                    const selectId = `cadence-${person.clientKey}`;
                    return (
                      <li key={person.clientKey} className="flex items-center gap-2 py-2 pl-4 pr-2">
                        <span className="min-w-0 flex-1 truncate text-base text-ink">{person.name}</span>
                        <label htmlFor={selectId} className="sr-only">
                          Cadence for {person.name}
                        </label>
                        <select
                          id={selectId}
                          value={person.cadenceDays}
                          onChange={(e) => setCadence(person.clientKey, Number(e.target.value))}
                          className="h-11 shrink-0 rounded-[10px] border border-hairline bg-surface px-3 text-sm text-ink outline-none focus-visible:border-harbour focus-visible:ring-2 focus-visible:ring-harbour/30"
                        >
                          {CADENCE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(person.clientKey)}
                          aria-label={`Remove ${person.name}`}
                        >
                          <X strokeWidth={1.5} aria-hidden />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {partnerFull ? null : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={inputId} className="sr-only">
                      Add a name to {group.label}
                    </Label>
                    <Input
                      id={inputId}
                      value={drafts[group.key] ?? ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [group.key]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          add(group);
                        }
                      }}
                      placeholder={group.key === "partner" ? "Partner's first name" : "First name"}
                      autoCapitalize="words"
                      autoComplete="off"
                      enterKeyHint="done"
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={() => add(group)} disabled={!(drafts[group.key] ?? "").trim()}>
                    Add
                  </Button>
                </div>
              )}
            </section>
          );
        })}

        {rows.length === 0 ? <StepNote>Today works better with at least one person. You can add people later in More.</StepNote> : null}
        {fe.people ? <StepNote tone="error">{fe.people}</StepNote> : null}

        <StepActions step={7} pending={pending} />
      </form>
    </StepShell>
  );
}
