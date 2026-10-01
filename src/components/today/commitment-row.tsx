"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cn } from "cn";
import { toggleCommitment } from "@/lib/daily/actions";
import { Ring } from "./ring";

interface CommitmentRowProps {
  id: number;
  label: string;
  completed: boolean;
}

/**
 * Full-width 56px tap row. Label left, ring right. Writes immediately with an optimistic
 * fill so the tap feels instant; the server mirrors the item onto today's entry.
 */
export function CommitmentRow({ id, label, completed }: CommitmentRowProps) {
  const [optimistic, setOptimistic] = useOptimistic(completed);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onTap = () => {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      setError(null);
      const result = await toggleCommitment(id, next);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onTap}
        aria-pressed={optimistic}
        aria-busy={pending || undefined}
        className={cn(
          "flex h-14 w-full items-center justify-between gap-4 px-4 text-left text-base text-ink outline-none",
          "transition-transform duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        )}
      >
        <span className={cn("truncate", optimistic && "text-ink-soft")}>{label}</span>
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
