"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hairline } from "@/components/layout/section";
import { logPatternAction, updateOccurrenceDetailAction } from "@/lib/patterns/actions";
import type { PatternView } from "@/lib/patterns/schemas";

interface PatternLogProps {
  /** null while loading */
  patterns: PatternView[] | null;
  loggedLine: string;
  onClose: () => void;
}

const DETAIL_FIELDS: { key: DetailKey; label: string }[] = [
  { key: "cue", label: "Cue" },
  { key: "desire", label: "Desire" },
  { key: "old_response", label: "Old response" },
  { key: "immediate_reward", label: "Immediate reward" },
  { key: "long_term_cost", label: "Long-term cost" },
  { key: "prime_response", label: "Prime response" },
  { key: "action_taken", label: "Action taken" },
  { key: "lesson", label: "Lesson" },
];

type DetailKey =
  | "cue"
  | "desire"
  | "old_response"
  | "immediate_reward"
  | "long_term_cost"
  | "prime_response"
  | "action_taken"
  | "lesson";

const tileClass =
  "flex min-h-16 w-full items-center rounded-[10px] bg-surface-raised px-4 py-3 text-left text-base font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-hairline/70 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Two taps: which pattern, then what happened. Everything else is optional. */
export function PatternLog({ patterns, loggedLine, onClose }: PatternLogProps) {
  const [chosen, setChosen] = useState<PatternView | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [occurrenceId, setOccurrenceId] = useState<number | null>(null);
  const [response, setResponse] = useState<"followed" | "replaced" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (patterns === null) {
    return <p className="py-6 text-sm text-ink-soft">Loading your patterns.</p>;
  }

  const inFocus = patterns.filter((p) => p.inFocus);
  const rest = patterns.filter((p) => !p.inFocus);

  if (occurrenceId !== null && chosen) {
    return (
      <Logged
        occurrenceId={occurrenceId}
        line={loggedLine || "Logged. One appearance is information, not a verdict."}
        pattern={chosen}
        response={response}
        onClose={onClose}
      />
    );
  }

  if (chosen) {
    const respond = (value: "followed" | "replaced") => {
      setError(null);
      setResponse(value);
      startTransition(async () => {
        const res = await logPatternAction({ patternId: chosen.patternId, response: value });
        if (res.error || !res.occurrenceId) {
          setError(res.error ?? "Could not log that. Try again.");
          setResponse(null);
          return;
        }
        setOccurrenceId(res.occurrenceId);
      });
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-base font-medium text-ink">{chosen.name}</p>
          <p className="text-sm text-ink-soft">What happened?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" disabled={pending} onClick={() => respond("followed")}>
            Followed it
          </Button>
          <Button size="lg" disabled={pending} onClick={() => respond("replaced")}>
            Did the replacement
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-ember" role="alert">
            {error}
          </p>
        ) : null}
        <Reminder pattern={chosen} />
        <button type="button" onClick={() => setChosen(null)} className="h-11 text-sm text-ink-soft hover:text-ink">
          Choose a different pattern
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Which pattern?</p>
      {inFocus.length ? (
        <div className="grid grid-cols-2 gap-3">
          {inFocus.map((p) => (
            <button key={p.patternId} type="button" className={tileClass} onClick={() => setChosen(p)}>
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">
          No patterns in focus yet.{" "}
          <Link href="/more/patterns" className="text-harbour underline-offset-4 hover:underline" onClick={onClose}>
            Choose up to five
          </Link>
          .
        </p>
      )}
      {rest.length ? (
        <div className="space-y-3">
          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => setShowMore((v) => !v)}
            className="h-11 text-sm font-medium text-harbour"
          >
            {showMore ? "Fewer patterns" : "More patterns"}
          </button>
          {showMore ? (
            <div className="grid grid-cols-2 gap-3">
              {rest.map((p) => (
                <button
                  key={p.patternId}
                  type="button"
                  className={cn(tileClass, "min-h-14 font-normal")}
                  onClick={() => setChosen(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Reminder({ pattern }: { pattern: PatternView }) {
  return (
    <div className="space-y-2 rounded-[10px] bg-paper px-4 py-3">
      <p className="text-sm text-ink-soft">
        <span className="text-ink">Replacement:</span> {pattern.replacement}
      </p>
      <p className="text-sm text-ink-soft">
        <span className="text-ink">IF-THEN:</span> {pattern.ifThen}
      </p>
    </div>
  );
}

function Logged({
  occurrenceId,
  line,
  pattern,
  response,
  onClose,
}: {
  occurrenceId: number;
  line: string;
  pattern: PatternView;
  response: "followed" | "replaced" | null;
  onClose: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const input: Record<string, string | null> = {};
      for (const f of DETAIL_FIELDS) input[f.key] = (formData.get(f.key) as string | null) ?? null;
      const res = await updateOccurrenceDetailAction({ occurrenceId, ...input });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-5">
      <p className="font-display text-lg text-ink">{line}</p>
      <p className="text-sm text-ink-soft">
        {pattern.name}: {response === "replaced" ? "did the replacement." : "followed it."}
      </p>
      {response === "followed" ? <Reminder pattern={pattern} /> : null}

      {saved ? (
        <p className="text-sm text-ink-soft" role="status">
          Detail saved.
        </p>
      ) : showDetail ? (
        <form action={save} className="space-y-4">
          <Hairline />
          <p className="text-sm text-ink-soft">All optional. Write what helps.</p>
          {DETAIL_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`detail-${f.key}`}>{f.label}</Label>
              <Input id={`detail-${f.key}`} name={f.key} autoComplete="off" />
            </div>
          ))}
          {error ? (
            <p className="text-sm text-ember" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : "Save detail"}
            </Button>
          </div>
        </form>
      ) : null}

      {!showDetail || saved ? (
        <div className="grid grid-cols-2 gap-3">
          {!saved ? (
            <Button variant="secondary" onClick={() => setShowDetail(true)}>
              Add detail
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      ) : null}
    </div>
  );
}
