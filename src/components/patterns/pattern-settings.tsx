"use client";

import { useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Group } from "@/components/layout/section";
import { setPatternInFocusAction, updatePatternOverridesAction } from "@/lib/patterns/actions";
import { MAX_IN_FOCUS, type PatternView } from "@/lib/patterns/schemas";

interface PatternSettingsProps {
  patterns: PatternView[];
}

/** Library list with in-focus toggles (max five) and per-pattern overrides. */
export function PatternSettings({ patterns }: PatternSettingsProps) {
  const [error, setError] = useState<string | null>(null);
  const inFocusCount = patterns.filter((p) => p.inFocus).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft" aria-live="polite">
        {inFocusCount} of {MAX_IN_FOCUS} in focus. These appear on the quick log.
      </p>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
      <Group>
        {patterns.map((p) => (
          <PatternRow key={p.patternId} pattern={p} onError={setError} />
        ))}
      </Group>
    </div>
  );
}

function PatternRow({ pattern, onError }: { pattern: PatternView; onError: (m: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [replacement, setReplacement] = useState(pattern.replacementOverride ?? "");
  const [ifThen, setIfThen] = useState(pattern.ifThenOverride ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleFocus() {
    onError(null);
    startTransition(async () => {
      const res = await setPatternInFocusAction({ patternId: pattern.patternId, inFocus: !pattern.inFocus });
      if (res.error) onError(res.error);
    });
  }

  function saveOverrides(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updatePatternOverridesAction({
        patternId: pattern.patternId,
        replacementOverride: replacement,
        ifThenOverride: ifThen,
      });
      if (res.error) onError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="px-4">
      <div className="flex min-h-14 items-center gap-3 py-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            className={cn("size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-90")}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="truncate text-base text-ink">{pattern.name}</span>
        </button>
        <button
          type="button"
          aria-pressed={pattern.inFocus}
          disabled={pending}
          onClick={toggleFocus}
          className={cn(
            "inline-flex h-11 shrink-0 items-center rounded-[999px] px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
            pattern.inFocus ? "bg-harbour text-primary-foreground" : "bg-surface-raised text-ink-soft hover:text-ink",
          )}
        >
          {pattern.inFocus ? "In focus" : "Add to focus"}
        </button>
      </div>

      {open ? (
        <form onSubmit={saveOverrides} className="space-y-4 pb-5 pl-6">
          <p className="text-sm text-ink-soft">{pattern.description}</p>

          <div className="space-y-1.5">
            <Label htmlFor={`rep-${pattern.patternId}`}>Replacement behaviour</Label>
            <Input
              id={`rep-${pattern.patternId}`}
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder={pattern.replacement}
              maxLength={1000}
            />
            {!replacement.trim() ? (
              <p className="text-xs text-ink-faint">Using the library text. Write your own to override it.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`ifthen-${pattern.patternId}`}>IF-THEN plan</Label>
            <Input
              id={`ifthen-${pattern.patternId}`}
              value={ifThen}
              onChange={(e) => setIfThen(e.target.value)}
              placeholder={pattern.ifThen}
              maxLength={1000}
            />
          </div>

          {pattern.twoMinuteStart ? (
            <p className="text-sm text-ink-soft">
              <span className="text-ink">Two-minute start:</span> {pattern.twoMinuteStart}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              {pending ? "Saving" : "Save"}
            </Button>
            {saved ? (
              <span className="text-sm text-ink-soft" role="status">
                Saved.
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
