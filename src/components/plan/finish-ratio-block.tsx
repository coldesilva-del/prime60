"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { FinishRatioSummary } from "@/lib/projects/queries";

/**
 * Counts at 30 days always; the 90-day ratio only once there are three starts.
 * Tapping the block opens a sheet with the formula. Never a misleading value.
 */
export function FinishRatioBlock({ summary }: { summary: FinishRatioSummary }) {
  const [open, setOpen] = useState(false);
  const { thirty, ninety } = summary;

  const ratioText =
    ninety.ratio !== null
      ? `${Math.round(ninety.ratio * 100)}% (${ninety.finished} of ${ninety.started})`
      : `Building (${ninety.started} ${ninety.started === 1 ? "start" : "starts"} so far)`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full space-y-1 rounded-[16px] bg-surface px-4 py-4 text-left outline-none transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Explain the Finish Ratio"
      >
        <p className="text-sm text-ink-soft">Last 30 days</p>
        <p className="text-base text-ink">
          {thirty.finished} finished, {thirty.started} started
        </p>
        <p className="pt-2 text-sm text-ink-soft">Finish Ratio, 90 days</p>
        <p className="text-base text-ink">{ratioText}</p>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto w-full max-w-[520px] gap-0 rounded-t-[16px] border-t-0 bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2 shadow-[var(--shadow-sheet)]"
        >
          <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-hairline" />
          <SheetTitle className="mb-3 font-sans text-lg font-semibold text-ink">How the Finish Ratio works</SheetTitle>
          <div className="space-y-3 text-base text-ink-soft">
            <p>Projects finished in the window divided by projects started in the window.</p>
            <p>
              A start is a status change to active. A finish is a status change to finished. Each project counts once
              for each.
            </p>
            <p>
              Over 90 days: {ninety.finished} finished, {ninety.started} started.
              {ninety.ratio !== null
                ? ` ${ninety.finished} divided by ${ninety.started} is ${Math.round(ninety.ratio * 100)}%.`
                : " The ratio appears once there are three starts, because one finish over one start says nothing."}
            </p>
            <p>The 30-day counts are always shown so you can see the shape of the month.</p>
          </div>
          <Button size="full" className="mt-5" onClick={() => setOpen(false)}>
            Close
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
