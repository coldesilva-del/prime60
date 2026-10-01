"use client";

import { useActionState, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Field, FormError } from "@/components/forms/field";
import { SelectField } from "@/components/settings/select-field";
import { setNonNegotiableAction } from "@/lib/account/actions";
import { PILLAR_LABELS, PILLARS } from "@/lib/account/schemas";
import type { ActionState } from "@/lib/auth/schemas";
import type { NonNegotiableCatalogueRow, NonNegotiableRow } from "@/lib/supabase/types";

const initial: ActionState = {};

interface NonNegotiableEditorProps {
  slot: 1 | 2 | 3;
  current: NonNegotiableRow | null;
  catalogue: NonNegotiableCatalogueRow[];
}

/** One row per slot. Opens a sheet to pick from the catalogue or write your own. */
export function NonNegotiableEditor({ slot, current, catalogue }: NonNegotiableEditorProps) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>("");
  const [state, formAction, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await setNonNegotiableAction(prev, formData);
    if (result.ok) setOpen(false);
    return result;
  }, initial);
  const fe = state.fieldErrors ?? {};

  const custom = choice === "custom";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-raised"
          />
        }
      >
        <span className="min-w-0">
          <span className="block text-sm text-ink-soft">Non-negotiable {slot}</span>
          <span className="block truncate text-base text-ink">{current ? current.label : "Not set"}</span>
          {current ? <span className="block text-sm text-ink-faint">{PILLAR_LABELS[current.pillar]}</span> : null}
        </span>
        <span className="shrink-0 text-sm font-medium text-harbour">Change</span>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-[16px] bg-surface pb-6 text-ink">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-hairline" aria-hidden />
        <SheetHeader>
          <SheetTitle className="font-sans text-xl font-semibold text-ink">Non-negotiable {slot}</SheetTitle>
          <SheetDescription className="text-base text-ink-soft">
            Pick one from the list or write your own. It replaces the current one from tomorrow.
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="space-y-5 px-4" noValidate>
          <input type="hidden" name="slot" value={slot} />
          <FormError message={state.error} />
          <fieldset className="space-y-1">
            <legend className="sr-only">Choose a non-negotiable</legend>
            <div className="divide-y divide-hairline overflow-hidden rounded-[16px] bg-paper">
              {catalogue.map((item) => {
                const checked = choice === String(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-3",
                      checked ? "bg-harbour-soft" : "hover:bg-surface-raised",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-base text-ink">{item.label}</span>
                      <span className="block text-sm text-ink-faint">{PILLAR_LABELS[item.pillar]}</span>
                    </span>
                    <input
                      type="radio"
                      name="catalogueId"
                      value={item.id}
                      checked={checked}
                      onChange={() => setChoice(String(item.id))}
                      className="size-5 shrink-0 accent-harbour"
                    />
                  </label>
                );
              })}
              <label
                className={cn(
                  "flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-3",
                  custom ? "bg-harbour-soft" : "hover:bg-surface-raised",
                )}
              >
                <span className="text-base text-ink">Write my own</span>
                <input
                  type="radio"
                  name="catalogueId"
                  value=""
                  checked={custom}
                  onChange={() => setChoice("custom")}
                  className="size-5 shrink-0 accent-harbour"
                />
              </label>
            </div>
          </fieldset>
          {custom ? (
            <div className="space-y-4">
              <Field
                label="Label"
                name="customLabel"
                placeholder="In bed by 10"
                maxLength={60}
                autoComplete="off"
                error={fe.customLabel}
              />
              <SelectField label="Pillar" name="pillar" defaultValue="" error={fe.pillar}>
                <option value="" disabled>
                  Choose a pillar
                </option>
                {PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {PILLAR_LABELS[p]}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}
          <Button type="submit" size="full" disabled={pending || choice === ""}>
            {pending ? "Saving" : "Save"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
