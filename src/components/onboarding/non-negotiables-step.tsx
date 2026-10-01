"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { Field, FormError } from "@/components/forms/field";
import { StepActions, StepNote, StepShell } from "@/components/onboarding/step-shell";
import { saveNonNegotiablesStep } from "@/lib/onboarding/actions";
import type { ActionState } from "@/lib/onboarding/schemas";
import { NON_NEGOTIABLE_COUNT, PILLARS } from "@/lib/onboarding/steps";
import type { NonNegotiableCatalogueRow, Pillar } from "@/lib/supabase/types";
import { cn } from "cn";

export type CustomNonNegotiable = { label: string; pillar: Pillar };

interface NonNegotiablesStepProps {
  catalogue: NonNegotiableCatalogueRow[];
  initialCatalogueIds: number[];
  initialCustom: CustomNonNegotiable | null;
}

const initial: ActionState = {};

const PILLAR_LABEL: Record<Pillar, string> = {
  health: "Health",
  identity: "Identity",
  relationships: "Relationships",
  purpose: "Purpose",
};

export function NonNegotiablesStep({ catalogue, initialCatalogueIds, initialCustom }: NonNegotiablesStepProps) {
  const [state, action, pending] = useActionState(saveNonNegotiablesStep, initial);
  const fe = state.fieldErrors ?? {};
  const [catalogueIds, setCatalogueIds] = useState<number[]>(initialCatalogueIds);
  const [customOn, setCustomOn] = useState(initialCustom !== null);
  const [customLabel, setCustomLabel] = useState(initialCustom?.label ?? "");
  const [customPillar, setCustomPillar] = useState<Pillar | null>(initialCustom?.pillar ?? null);
  const [limitNote, setLimitNote] = useState<string | null>(null);

  const chosen = new Set(catalogueIds);
  const total = catalogueIds.length + (customOn ? 1 : 0);

  function toggle(id: number) {
    if (chosen.has(id)) {
      setCatalogueIds((ids) => ids.filter((x) => x !== id));
      setLimitNote(null);
      return;
    }
    if (total >= NON_NEGOTIABLE_COUNT) {
      setLimitNote(`Three is the number. Remove one to add another.`);
      return;
    }
    setCatalogueIds((ids) => [...ids, id]);
    setLimitNote(null);
  }

  function toggleCustom() {
    if (customOn) {
      setCustomOn(false);
      setLimitNote(null);
      return;
    }
    if (total >= NON_NEGOTIABLE_COUNT) {
      setLimitNote(`Three is the number. Remove one to add your own.`);
      return;
    }
    setCustomOn(true);
    setLimitNote(null);
  }

  const payload = JSON.stringify({
    catalogueIds,
    custom: customOn ? { label: customLabel, pillar: customPillar } : null,
  });

  return (
    <StepShell
      title="Non-negotiables"
      lede={`Three standing daily commitments. Each maps to a score item, so tapping it on Today earns the points. Train, Publish and Connect are a strong default.`}
    >
      <form action={action} className="space-y-5" noValidate>
        <FormError message={state.error} />
        <input type="hidden" name="payload" value={payload} />

        <p className="text-sm text-ink-soft" aria-live="polite">
          {total} of {NON_NEGOTIABLE_COUNT} chosen.
        </p>

        <ul className="divide-y divide-hairline overflow-hidden rounded-[16px] bg-surface" aria-label="Catalogue">
          {catalogue.map((item) => {
            const selected = chosen.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-4 px-4 py-2 text-left outline-none transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    selected ? "bg-harbour-soft" : "hover:bg-surface-raised",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-soft">{PILLAR_LABEL[item.pillar]}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                      selected ? "border-harbour bg-harbour text-primary-foreground" : "border-hairline",
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="size-4" strokeWidth={2} /> : null}
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-pressed={customOn}
              onClick={toggleCustom}
              className={cn(
                "flex min-h-14 w-full items-center gap-4 px-4 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                customOn ? "bg-harbour-soft" : "hover:bg-surface-raised",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-base text-ink">Write your own</span>
                <span className="block text-xs text-ink-soft">Choose the pillar it belongs to</span>
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                  customOn ? "border-harbour bg-harbour text-primary-foreground" : "border-hairline",
                )}
                aria-hidden
              >
                {customOn ? <Check className="size-4" strokeWidth={2} /> : null}
              </span>
            </button>
            {customOn ? (
              <div className="space-y-4 border-t border-hairline px-4 pb-4 pt-3">
                <Field
                  label="Your non-negotiable"
                  name="customLabel"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="In bed by 10"
                  autoCapitalize="sentences"
                  autoComplete="off"
                />
                <div className="space-y-2">
                  <span className="block text-sm font-medium text-ink" id="custom-pillar-label">
                    Pillar
                  </span>
                  <div role="radiogroup" aria-labelledby="custom-pillar-label" className="grid grid-cols-2 gap-2">
                    {PILLARS.map((p) => {
                      const on = customPillar === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setCustomPillar(p.value)}
                          className={cn(
                            "h-11 rounded-[10px] border text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            on ? "border-harbour bg-harbour text-primary-foreground" : "border-hairline bg-surface text-ink hover:bg-surface-raised",
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {fe.custom ? <StepNote tone="error">{fe.custom}</StepNote> : null}
              </div>
            ) : null}
          </li>
        </ul>

        {limitNote ? <StepNote>{limitNote}</StepNote> : null}
        {fe.catalogueIds ? <StepNote tone="error">{fe.catalogueIds}</StepNote> : null}

        <StepActions step={8} pending={pending} />
      </form>
    </StepShell>
  );
}
