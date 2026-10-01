"use client";

import { useState, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Hairline } from "@/components/layout/section";
import { decideIdeaAction } from "@/lib/ideas/actions";
import type { FilterAnswers, IdeaDecision } from "@/lib/ideas/schemas";
import { PILLARS } from "@/lib/projects/schemas";
import type { IdeaRow, Pillar } from "@/lib/supabase/types";

interface IdeaFilterProps {
  idea: IdeaRow;
}

const chipClass =
  "inline-flex min-h-11 items-center rounded-[999px] border px-4 text-[15px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function readAnswers(value: IdeaRow["filter_answers"]): FilterAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;
  const bool = (x: unknown) => (typeof x === "boolean" ? x : null);
  const text = (x: unknown) => (typeof x === "string" ? x : null);
  const pillar = PILLARS.some((p) => p.value === v.pillar) ? (v.pillar as Pillar) : null;
  return {
    supportsVision: bool(v.supportsVision),
    servesAudience: bool(v.servesAudience),
    pillar,
    replaces: text(v.replaces),
    genuineValue: text(v.genuineValue),
    evidenceNow: bool(v.evidenceNow),
  };
}

function YesNoRow({
  id,
  question,
  value,
  onChange,
}: {
  id: string;
  question: string;
  value: boolean | null | undefined;
  onChange: (v: boolean) => void;
}) {
  const base =
    "h-12 flex-1 text-[15px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-base text-ink">
        {question}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex overflow-hidden rounded-[10px] border border-hairline bg-surface">
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          onClick={() => onChange(true)}
          className={cn(base, value === true ? "bg-harbour text-primary-foreground" : "text-ink-soft hover:bg-surface-raised")}
        >
          Yes
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          onClick={() => onChange(false)}
          className={cn(
            base,
            "border-l border-hairline",
            value === false ? "bg-surface-raised text-ink" : "text-ink-soft hover:bg-surface-raised",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
}

/**
 * "Consider pursuing" reveals the six filter questions and a decision.
 * Park carries the default emphasis. Pursue is deliberately not the primary button.
 */
export function IdeaFilter({ idea }: IdeaFilterProps) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<FilterAnswers>(() => readAnswers(idea.filter_answers));
  const [confirmKill, setConfirmKill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<IdeaDecision | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: IdeaDecision) {
    setError(null);
    startTransition(async () => {
      const res = await decideIdeaAction({ id: idea.id, decision, answers });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setConfirmKill(false);
      setSaved(decision);
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" size="full" onClick={() => setOpen(true)}>
        Consider pursuing
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      <Hairline />
      <p className="text-sm text-ink-soft">Six questions. Short answers are fine.</p>

      <YesNoRow
        id="q1"
        question="1. Does this directly support your Prime Self vision?"
        value={answers.supportsVision}
        onChange={(v) => setAnswers((a) => ({ ...a, supportsVision: v }))}
      />
      <YesNoRow
        id="q2"
        question="2. Does this serve the audience you chose?"
        value={answers.servesAudience}
        onChange={(v) => setAnswers((a) => ({ ...a, servesAudience: v }))}
      />

      <fieldset className="space-y-2">
        <legend className="text-base text-ink">3. Which pillar does this strengthen?</legend>
        <div role="radiogroup" aria-label="Pillar" className="flex flex-wrap gap-2">
          {PILLARS.map((p) => {
            const selected = answers.pillar === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((a) => ({ ...a, pillar: p.value }))}
                className={cn(
                  chipClass,
                  selected
                    ? "border-harbour bg-harbour text-primary-foreground"
                    : "border-hairline bg-surface text-ink hover:bg-surface-raised",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="q4" className="text-base font-normal">
          4. What current priority would this replace?
        </Label>
        <Textarea
          id="q4"
          value={answers.replaces ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, replaces: e.target.value }))}
          maxLength={500}
          className="min-h-20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="q5" className="text-base font-normal">
          5. Is this genuinely valuable, or are you escaping something harder?
        </Label>
        <Textarea
          id="q5"
          value={answers.genuineValue ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, genuineValue: e.target.value }))}
          maxLength={500}
          className="min-h-20"
        />
      </div>

      <YesNoRow
        id="q6"
        question="6. Is there evidence this deserves attention now?"
        value={answers.evidenceNow}
        onChange={(v) => setAnswers((a) => ({ ...a, evidenceNow: v }))}
      />

      <Hairline />

      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
      {saved && saved !== "pursue" ? (
        <p className="text-sm text-ink-soft" role="status">
          {saved === "park"
            ? "Parked. It will be here when you are ready."
            : saved === "review_30"
              ? "Set aside. It comes back for a look in 30 days."
              : "Killed. It stays under the Killed list."}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm text-ink-soft">Decision</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={pending} onClick={() => decide("pursue")}>
            Pursue
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => decide("review_30")}>
            Review in 30 days
          </Button>
          <Button disabled={pending} onClick={() => decide("park")}>
            Park
          </Button>
          {confirmKill ? (
            <Button variant="destructive" disabled={pending} onClick={() => decide("kill")}>
              Kill it
            </Button>
          ) : (
            <Button variant="ghost" className="text-ink-soft" disabled={pending} onClick={() => setConfirmKill(true)}>
              Kill
            </Button>
          )}
        </div>
        {confirmKill ? (
          <p className="text-sm text-ink-soft">Killed ideas stay in the lot under Killed. Tap Kill it to confirm.</p>
        ) : null}
      </div>
    </div>
  );
}
