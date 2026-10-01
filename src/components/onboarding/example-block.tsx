"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface ExampleBlockProps {
  example: string;
  onUse: (text: string) => void;
  summary?: string;
  className?: string;
}

/**
 * A worked example, collapsed by default, with one action that copies it
 * into the field above. Rendered in the serif because it is North Star text.
 */
export function ExampleBlock({ example, onUse, summary = "See a worked example", className }: ExampleBlockProps) {
  const [open, setOpen] = useState(false);
  if (!example) return null;
  return (
    <div className={cn("overflow-hidden rounded-[16px] bg-surface", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
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
          <p className="font-display text-lg leading-snug text-ink">{example}</p>
          <Button type="button" variant="secondary" size="full" onClick={() => onUse(example)}>
            Use this as a starting point
          </Button>
        </div>
      ) : null}
    </div>
  );
}
