"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Figure } from "@/lib/review/snapshot";

interface FigureListProps {
  figures: Figure[];
}

/**
 * The week's numbers. Every row is a 44px target that opens a sheet listing
 * the inputs and how the number was arrived at.
 */
export function FigureList({ figures }: FigureListProps) {
  const [open, setOpen] = useState<Figure | null>(null);

  return (
    <>
      <ul className="divide-y divide-hairline rounded-[16px] bg-surface">
        {figures.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              onClick={() => setOpen(f)}
              aria-label={`${f.label}: ${f.value}. Explain this number`}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <span className="text-base text-ink-soft">{f.label}</span>
              <span className="shrink-0 text-base font-medium text-ink underline decoration-ink-faint decoration-dotted underline-offset-4">
                {f.value}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-[16px] pb-6 shadow-[var(--shadow-sheet)]">
          <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-hairline" />
          {open ? (
            <>
              <SheetHeader className="pb-0">
                <SheetTitle className="font-sans text-sm font-medium text-ink-soft">{open.label}</SheetTitle>
                <p className="text-2xl font-medium text-ink">{open.value}</p>
                {open.note ? <SheetDescription className="text-sm text-ink-soft">{open.note}</SheetDescription> : null}
              </SheetHeader>
              <div className="px-4">
                <h3 className="mb-2 text-sm font-medium text-ink-soft">Inputs</h3>
                <ul className="max-h-[50vh] divide-y divide-hairline overflow-y-auto rounded-[12px] bg-paper">
                  {open.inputs.map((line, i) => (
                    <li key={i} className="px-3 py-2.5 text-sm text-ink">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
