"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cn } from "cn";
import { FormError } from "@/components/forms/field";
import { setPatternFocusAction } from "@/lib/review/actions";
import type { PatternChoice } from "@/lib/review/queries";
import { MAX_PATTERNS_IN_FOCUS } from "@/lib/review/schemas";

interface PatternFocusProps {
  patterns: PatternChoice[];
}

/** Rotate the patterns in focus. Five at most; the server enforces it too. */
export function PatternFocus({ patterns }: PatternFocusProps) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    patterns,
    (state, change: { patternId: number; inFocus: boolean }) =>
      state.map((p) => (p.patternId === change.patternId ? { ...p, inFocus: change.inFocus } : p)),
  );

  const inFocus = optimistic.filter((p) => p.inFocus).length;
  const full = inFocus >= MAX_PATTERNS_IN_FOCUS;

  function toggle(p: PatternChoice) {
    const next = !p.inFocus;
    if (next && full) {
      setError("Five patterns is the limit. Take one out of focus first.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      setOptimistic({ patternId: p.patternId, inFocus: next });
      const result = await setPatternFocusAction({ patternId: p.patternId, inFocus: next });
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-ink-soft">Patterns in focus</h3>
        <span className="text-sm text-ink-soft" aria-live="polite">
          {inFocus} of {MAX_PATTERNS_IN_FOCUS}
        </span>
      </div>
      <FormError message={error} />
      <ul className="divide-y divide-hairline rounded-[16px] bg-surface">
        {optimistic.map((p) => (
          <li key={p.patternId} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-base text-ink">{p.name}</p>
              <p className="text-sm text-ink-soft">{p.replacement}</p>
            </div>
            <button
              type="button"
              aria-pressed={p.inFocus}
              disabled={pending}
              onClick={() => toggle(p)}
              className={cn(
                "h-11 shrink-0 rounded-[10px] px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                p.inFocus
                  ? "bg-harbour-soft text-harbour"
                  : full
                    ? "bg-surface-raised text-ink-faint"
                    : "bg-surface-raised text-ink hover:bg-hairline/70",
              )}
            >
              {p.inFocus ? "In focus" : "Bring in"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
