"use client";

import { startTransition, useOptimistic } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "cn";
import { connectTodayAction } from "@/lib/relationships/actions";
import { cadenceWords, driftNote, isDrifting } from "@/lib/relationships/drift";

interface PersonRowProps {
  id: number;
  name: string;
  cadenceDays: number;
  lastOn: string | null;
  connectedToday: boolean;
  today: string;
}

/**
 * Name, cadence in words, a gentle drift note when it applies, and a 28px
 * ring that fills in harbour once you have connected today. No counts, no badges.
 */
export function PersonRow({ id, name, cadenceDays, lastOn, connectedToday, today }: PersonRowProps) {
  const [connected, setConnected] = useOptimistic(connectedToday);
  const drifting = !connected && isDrifting(lastOn, cadenceDays, today);

  function connect() {
    if (connected) return;
    startTransition(async () => {
      setConnected(true);
      await connectTodayAction(id);
    });
  }

  return (
    <div className="flex items-stretch">
      <Link
        href={`/more/people/${id}`}
        className="flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3 transition-colors hover:bg-surface-raised"
      >
        <span className="text-base text-ink">{name}</span>
        <span className="text-xs text-ink-soft">{cadenceWords(cadenceDays)}</span>
        {drifting ? (
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ember" />
            {driftNote(name)}
          </span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={connect}
        aria-pressed={connected}
        aria-label={connected ? `Connected with ${name} today` : `Connected with ${name} today?`}
        className="flex w-16 shrink-0 items-center justify-center outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full border-2 border-harbour transition-colors duration-[180ms]",
            connected ? "bg-harbour text-primary-foreground" : "bg-transparent",
          )}
        >
          {connected ? <Check className="size-4" strokeWidth={2} aria-hidden /> : null}
        </span>
      </button>
    </div>
  );
}
