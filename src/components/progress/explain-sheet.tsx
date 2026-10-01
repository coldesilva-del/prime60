"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "cn";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Explain } from "@/lib/progress/types";

interface ExplainNumberProps {
  label: string;
  value: string;
  word?: string;
  explain: Explain;
  className?: string;
}

/**
 * A tappable number row. Opens a bottom sheet listing the inputs and the
 * arithmetic so the man can check the number himself.
 */
export function ExplainNumber({ label, value, word, explain, className }: ExplainNumberProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              className,
            )}
          />
        }
      >
        <span className="text-base text-ink">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-right">
            <span className="block text-base font-medium tabular-nums text-ink">{value}</span>
            {word ? <span className="block text-xs text-ink-soft">{word}</span> : null}
          </span>
          <ChevronRight className="size-4 text-ink-faint" strokeWidth={1.5} aria-hidden />
        </span>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-w-[520px] rounded-t-[16px] border-hairline bg-surface px-5 pb-10 pt-3 shadow-sheet"
      >
        <div aria-hidden className="mx-auto h-1 w-10 rounded-full bg-hairline" />
        <SheetHeader className="p-0">
          <SheetTitle className="font-sans text-lg font-semibold text-ink">Why this number</SheetTitle>
          <SheetDescription className="text-base text-ink-soft">
            {label}: {explain.value}
          </SheetDescription>
        </SheetHeader>
        <dl className="divide-y divide-hairline">
          {explain.inputs.map((input) => (
            <div key={input.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-sm text-ink-soft">{input.label}</dt>
              <dd className="text-sm font-medium tabular-nums text-ink">{input.value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-1">
          <p className="text-sm font-medium text-ink">Arithmetic</p>
          <ul className="space-y-1">
            {explain.arithmetic.map((line) => (
              <li key={line} className="text-sm text-ink-soft">
                {line}
              </li>
            ))}
          </ul>
        </div>
        {explain.note ? <p className="text-xs text-ink-faint">{explain.note}</p> : null}
      </SheetContent>
    </Sheet>
  );
}
