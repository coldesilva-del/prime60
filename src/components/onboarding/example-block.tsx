"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface ExampleBlockProps {
  examples: string[];
  onUse: (text: string) => void;
  summary?: string;
  className?: string;
}

/**
 * Worked examples, collapsed by default. Opening shows one chosen at random;
 * "See another example" steps through the rest. One action copies the shown
 * example into the field above. Rendered in the serif because it is North
 * Star text.
 */
export function ExampleBlock({ examples, onUse, summary = "See a worked example", className }: ExampleBlockProps) {
  const [open, setOpen] = useState(false);
  // Chosen on first open, not at render, so server and client markup agree.
  const [index, setIndex] = useState<number | null>(null);
  if (examples.length === 0) return null;

  const current = index ?? 0;
  const example = examples[current];

  function toggle() {
    if (index === null) setIndex(Math.floor(Math.random() * examples.length));
    setOpen((v) => !v);
  }

  return (
    <div className={cn("overflow-hidden rounded-[16px] bg-surface", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-ink outline-none hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {summary}
        <ChevronDown
          className={cn("size-5 shrink-0 text-ink-soft transition-transform duration-150", open && "rotate-180")}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-hairline px-4 pb-4 pt-3">
          {examples.length > 1 ? (
            <p className="text-sm text-ink-soft" aria-live="polite">
              Example {current + 1} of {examples.length}
            </p>
          ) : null}
          <p className="font-display text-lg leading-snug text-ink">{example}</p>
          <div className="space-y-2">
            <Button type="button" variant="secondary" size="full" onClick={() => onUse(example)}>
              Use this as a starting point
            </Button>
            {examples.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="full"
                onClick={() => setIndex((current + 1) % examples.length)}
              >
                See another example
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
