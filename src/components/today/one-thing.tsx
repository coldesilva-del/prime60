"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { cn } from "cn";
import { setOneThingFinished } from "@/lib/daily/actions";
import { Ring } from "./ring";

interface OneThingProps {
  text: string | null;
  finished: boolean;
}

/** The One Thing: serif 20px on a surface with a single Finished control beneath. */
export function OneThing({ text, finished }: OneThingProps) {
  const [optimistic, setOptimistic] = useOptimistic(finished);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!text) {
    return (
      <section aria-label="The one thing to finish" className="rounded-[16px] bg-surface px-4 py-4">
        <p className="text-sm text-ink-soft">The one thing to finish</p>
        <Link
          href="/today/morning"
          className="mt-1 inline-flex min-h-11 items-center text-base text-harbour"
        >
          Set the one thing to finish today
        </Link>
      </section>
    );
  }

  const onTap = () => {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      setError(null);
      const result = await setOneThingFinished(next);
      if (result.error) setError(result.error);
    });
  };

  return (
    <section aria-label="The one thing to finish" className="rounded-[16px] bg-surface px-4 pt-4 pb-2">
      <p className="text-sm text-ink-soft">The one thing to finish</p>
      <p className={cn("font-display mt-1 text-lg text-ink", optimistic && "text-ink-soft")}>{text}</p>
      <button
        type="button"
        onClick={onTap}
        aria-pressed={optimistic}
        className={cn(
          "-mx-2 mt-2 flex h-12 w-[calc(100%+16px)] items-center justify-between rounded-[10px] px-2 text-left text-[15px] font-medium outline-none",
          "transition-transform duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring",
          optimistic ? "text-ink-soft" : "text-ink",
        )}
      >
        <span>Finished</span>
        <Ring done={optimistic} />
      </button>
      {error ? (
        <p className="pb-2 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
