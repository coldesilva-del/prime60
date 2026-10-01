import { ChevronDown } from "lucide-react";
import type { HabitStackRow } from "@/lib/supabase/types";

/** Habit stacks, collapsed by default. Native disclosure so it needs no JavaScript. */
export function HabitStacks({ stacks }: { stacks: HabitStackRow[] }) {
  if (stacks.length === 0) return null;
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm text-ink-soft outline-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-ring rounded-[8px]">
        <span>
          Habit stacks ({stacks.length})
        </span>
        <ChevronDown
          className="size-5 shrink-0 transition-transform duration-150 group-open:rotate-180"
          strokeWidth={1.5}
          aria-hidden
        />
      </summary>
      <ul className="space-y-2 pb-2 pt-1">
        {stacks.map((s) => (
          <li key={s.id} className="text-base text-ink">
            After {s.anchor}, {s.behaviour}
          </li>
        ))}
      </ul>
    </details>
  );
}
