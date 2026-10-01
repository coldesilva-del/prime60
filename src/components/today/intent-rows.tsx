"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cn } from "cn";
import { Group } from "@/components/layout/section";
import { recordConnectedToday, recordCourageIntent } from "@/lib/daily/actions";
import type { ActionState } from "@/lib/auth/schemas";
import { Ring } from "./ring";

interface IntentRowProps {
  label: string;
  done: boolean;
  action: () => Promise<ActionState>;
}

/** A compact 48px tap row. Recording is one way: tapping again never removes the evidence. */
function IntentRow({ label, done, action }: IntentRowProps) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onTap = () => {
    if (optimistic) return;
    startTransition(async () => {
      setOptimistic(true);
      setError(null);
      const result = await action();
      if (result.error) setError(result.error);
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onTap}
        aria-pressed={optimistic}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-4 px-4 text-left text-[15px] outline-none",
          "transition-transform duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          optimistic ? "text-ink-soft" : "text-ink",
        )}
      >
        <span className="truncate">{label}</span>
        <Ring done={optimistic} />
      </button>
      {error ? (
        <p className="px-4 pb-2 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface IntentRowsProps {
  courageLabel: string | null;
  courageDone: boolean;
  personName: string | null;
  connected: boolean;
}

/** Today's Courage Rep intention and today's person, each one tap to record. */
export function IntentRows({ courageLabel, courageDone, personName, connected }: IntentRowsProps) {
  if (!courageLabel && !personName) return null;
  return (
    <Group>
      {courageLabel ? (
        <IntentRow label={`Courage Rep: ${courageLabel}`} done={courageDone} action={recordCourageIntent} />
      ) : null}
      {personName ? <IntentRow label={`${personName}: connect`} done={connected} action={recordConnectedToday} /> : null}
    </Group>
  );
}
