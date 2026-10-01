"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMorning } from "@/lib/daily/actions";

interface MorningFlowProps {
  identity: string | null;
  nonNegotiables: { id: number; label: string }[];
  /** Yesterday's one thing, only when it was not finished. */
  yesterday: { oneThing: string; projectId: number | null } | null;
  projects: { id: number; name: string; nextAction: string | null }[];
  courageRepTypes: { id: number; label: string }[];
  people: { id: number; name: string; groupLabel: string }[];
  initial: {
    oneThing: string;
    oneThingProjectId: number | null;
    courageIntentTypeId: number | null;
    personId: number | null;
  };
}

const STEPS = 4;

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 text-[15px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        selected ? "border-harbour bg-harbour text-primary-foreground" : "border-hairline bg-surface text-ink hover:bg-surface-raised",
      )}
    >
      {children}
    </button>
  );
}

function Dots({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS}`}>
      {Array.from({ length: STEPS }, (_, i) => (
        <li
          key={i}
          aria-current={i === step ? "step" : undefined}
          className={cn("h-2 rounded-full transition-colors duration-150", i === step ? "w-5 bg-harbour" : "w-2 bg-hairline")}
        />
      ))}
    </ol>
  );
}

/** Four screens, one route. Common path: four taps and one line of text. */
export function MorningFlow({ identity, nonNegotiables, yesterday, projects, courageRepTypes, people, initial }: MorningFlowProps) {
  const [step, setStep] = useState(0);
  const [oneThing, setOneThing] = useState(initial.oneThing);
  const [projectId, setProjectId] = useState<number | null>(initial.oneThingProjectId);
  const [courageId, setCourageId] = useState<number | null>(initial.courageIntentTypeId);
  const [personId, setPersonId] = useState<number | null>(initial.personId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const sameAsYesterday = () => {
    if (yesterday) {
      setOneThing(yesterday.oneThing);
      setProjectId(yesterday.projectId);
    } else {
      setOneThing("");
      setProjectId(null);
    }
    setStep(2);
  };

  const pickNextAction = (p: { id: number; nextAction: string | null }) => {
    if (!p.nextAction) return;
    setOneThing(p.nextAction);
    setProjectId(p.id);
  };

  const onType = (value: string) => {
    setOneThing(value);
    // Typing something else detaches the project link.
    if (projectId != null && projects.find((p) => p.id === projectId)?.nextAction !== value) setProjectId(null);
  };

  const startTheDay = () => {
    startTransition(async () => {
      setError(null);
      const result = await saveMorning({
        oneThing: oneThing.trim(),
        oneThingProjectId: projectId,
        courageIntentTypeId: courageId,
        personId,
      });
      if (result?.error) setError(result.error);
    });
  };

  const canContinueOneThing = oneThing.trim().length > 0;

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-8">
      <div className="flex items-center justify-between">
        {step === 0 ? (
          <Link href="/today" className="-ml-2 inline-flex h-11 items-center gap-1 pr-2 text-sm text-ink-soft hover:text-ink">
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            Today
          </Link>
        ) : (
          <button
            type="button"
            onClick={back}
            className="-ml-2 inline-flex h-11 items-center gap-1 pr-2 text-sm text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            Back
          </button>
        )}
        <Dots step={step} />
      </div>

      {step === 0 ? (
        <section className="flex flex-1 flex-col gap-6">
          <h1 className="text-sm text-ink-soft">Who am I becoming?</h1>
          {identity ? (
            <p className="font-display measure text-xl text-ink">{identity}</p>
          ) : (
            <p className="measure text-base text-ink-soft">
              You have not written an identity statement yet.{" "}
              <Link href="/more/identity" className="text-harbour">
                Add one
              </Link>
              .
            </p>
          )}
          <div className="mt-auto">
            <Button size="full" onClick={next}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="flex flex-1 flex-col gap-6">
          <h1 className="text-sm text-ink-soft">Today&apos;s non-negotiables</h1>
          {nonNegotiables.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {nonNegotiables.map((n) => (
                <li key={n.id} className="inline-flex min-h-11 items-center rounded-full bg-harbour-soft px-4 text-[15px] text-ink">
                  {n.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-ink-soft">No standing non-negotiables yet.</p>
          )}
          <Link href="/more/non-negotiables" className="inline-flex min-h-11 items-center text-sm text-harbour">
            Change my non-negotiables
          </Link>
          <div className="mt-auto flex flex-col gap-3">
            <Button variant="secondary" size="full" onClick={sameAsYesterday}>
              Same as yesterday
            </Button>
            <Button size="full" onClick={next}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex flex-1 flex-col gap-6">
          <div className="space-y-3">
            <label htmlFor="one-thing" className="block text-sm text-ink-soft">
              What must be finished today?
            </label>
            <Input
              id="one-thing"
              name="oneThing"
              value={oneThing}
              onChange={(e) => onType(e.target.value)}
              placeholder="One thing, finished"
              maxLength={200}
              autoComplete="off"
              autoCapitalize="sentences"
              enterKeyHint="done"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinueOneThing) {
                  e.preventDefault();
                  next();
                }
              }}
              className="h-14 text-lg"
            />
          </div>
          {projects.some((p) => p.nextAction) ? (
            <div className="space-y-2">
              <p className="text-sm text-ink-soft">Or pick a next action</p>
              <div role="radiogroup" aria-label="Project next actions" className="divide-y divide-hairline overflow-hidden rounded-[16px] bg-surface">
                {projects
                  .filter((p) => p.nextAction)
                  .map((p) => {
                    const selected = projectId === p.id && oneThing === p.nextAction;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => pickNextAction(p)}
                        className={cn(
                          "flex min-h-14 w-full flex-col justify-center px-4 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                          selected ? "bg-harbour-soft" : "hover:bg-surface-raised",
                        )}
                      >
                        <span className="text-xs text-ink-soft">{p.name}</span>
                        <span className="text-base text-ink">{p.nextAction}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : null}
          <div className="mt-auto">
            <Button size="full" onClick={next} disabled={!canContinueOneThing}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="flex flex-1 flex-col gap-6">
          <h1 className="text-sm text-ink-soft">Optional</h1>
          {courageRepTypes.length > 0 ? (
            <div className="space-y-3">
              <p className="text-base text-ink">A Courage Rep I may need today</p>
              <div role="radiogroup" aria-label="Courage Rep intention" className="flex flex-wrap gap-2">
                {courageRepTypes.map((t) => (
                  <Chip key={t.id} selected={courageId === t.id} onClick={() => setCourageId(courageId === t.id ? null : t.id)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
          {people.length > 0 ? (
            <div className="space-y-3">
              <p className="text-base text-ink">One person to invest in</p>
              <div role="radiogroup" aria-label="Today's person" className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <Chip key={p.id} selected={personId === p.id} onClick={() => setPersonId(personId === p.id ? null : p.id)}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-ember" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-auto">
            <Button size="full" onClick={startTheDay} disabled={pending || !canContinueOneThing}>
              {pending ? "Saving" : "Start the day"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
