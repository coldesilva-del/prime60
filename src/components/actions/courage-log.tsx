"use client";

import { useState, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordCourageRepAction } from "@/lib/courage/actions";
import type { CourageRepTypeRow } from "@/lib/supabase/types";

interface CourageLogProps {
  /** null while loading */
  types: CourageRepTypeRow[] | null;
  courageLine: string;
  onClose: () => void;
}

const tileClass =
  "flex min-h-12 w-full items-center rounded-[10px] px-4 py-3 text-left text-base text-ink transition-[background-color,transform] duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Pick a type (or write a short label), optional note, one tap to record. */
export function CourageLog({ types, courageLine, onClose }: CourageLogProps) {
  const [typeId, setTypeId] = useState<number | null>(null);
  const [custom, setCustom] = useState(false);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (types === null) {
    return <p className="py-6 text-sm text-ink-soft">Loading.</p>;
  }

  if (done) {
    return (
      <div className="space-y-5">
        <p className="font-display text-lg text-ink">{courageLine || "Courage Rep recorded. A vote for your Prime Self."}</p>
        <Button size="full" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const canSubmit = custom ? label.trim().length > 0 : typeId !== null;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await recordCourageRepAction({
        typeId: custom ? null : typeId,
        customLabel: custom ? label : null,
        note,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">What did you do?</p>
      <div role="radiogroup" aria-label="Courage Rep type" className="space-y-2">
        {types.map((t) => {
          const selected = !custom && typeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setCustom(false);
                setTypeId(t.id);
              }}
              className={cn(tileClass, selected ? "bg-harbour text-primary-foreground" : "bg-surface-raised hover:bg-hairline/70")}
            >
              {t.label}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          onClick={() => {
            setCustom(true);
            setTypeId(null);
          }}
          className={cn(tileClass, custom ? "bg-harbour text-primary-foreground" : "bg-surface-raised hover:bg-hairline/70")}
        >
          Something else
        </button>
      </div>

      {custom ? (
        <div className="space-y-1.5">
          <Label htmlFor="courage-label">What was it?</Label>
          <Input
            id="courage-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            autoFocus
            autoComplete="off"
            placeholder="A short label"
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="courage-note">Note (optional)</Label>
        <Input
          id="courage-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder="One line if it helps"
        />
      </div>

      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}

      <Button size="full" disabled={!canSubmit || pending} onClick={submit}>
        {pending ? "Recording" : "Record Courage Rep"}
      </Button>
    </div>
  );
}
