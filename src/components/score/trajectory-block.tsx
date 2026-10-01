"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { directionWord } from "@/lib/daily/helpers";
import type { Trajectory } from "@/lib/scoring/trajectory";
import type { Pillar } from "@/lib/scoring/score";

const PILLARS: { key: Pillar; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "purpose", label: "Purpose" },
  { key: "relationships", label: "Relationships" },
  { key: "identity", label: "Identity" },
];

/**
 * Prime Trajectory: 28-day average, direction word, four harbour bars.
 * Tapping the block opens the "How this is calculated" sheet.
 */
export function TrajectoryBlock({ trajectory }: { trajectory: Trajectory }) {
  const building = trajectory.value === null;
  const summary = building
    ? `Trajectory is building: ${trajectory.loggedDays} of ${trajectory.windowDays} days logged.`
    : `Trajectory ${trajectory.value}, ${directionWord(trajectory.direction).toLowerCase()}, over ${trajectory.loggedDays} logged days.`;

  return (
    <Sheet>
      <SheetTrigger
        className="block w-full rounded-[12px] text-left outline-none transition-transform duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
        aria-label={`${summary} Open how this is calculated.`}
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-ink-soft">Trajectory</span>
            {building ? (
              <span className="text-xs text-ink-faint">
                {trajectory.loggedDays} of {trajectory.windowDays} days logged
              </span>
            ) : null}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
              {building ? "Building" : trajectory.value}
            </span>
            {!building ? <span className="text-base text-ink-soft">{directionWord(trajectory.direction)}</span> : null}
          </div>
          <ul className="space-y-2" aria-hidden>
            {PILLARS.map(({ key, label }) => {
              const pct = trajectory.pillars[key];
              return (
                <li key={key} className="grid grid-cols-[96px_1fr_36px] items-center gap-3">
                  <span className="text-xs text-ink-soft">{label}</span>
                  <span className="block h-[6px] overflow-hidden rounded-full bg-hairline">
                    <span
                      className="block h-full rounded-full bg-harbour"
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </span>
                  <span className="text-right text-xs text-ink-soft tabular-nums">{pct == null ? "" : `${pct}%`}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[16px] pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-hairline" aria-hidden />
        <SheetHeader>
          <SheetTitle className="font-sans text-lg font-semibold text-ink">How this is calculated</SheetTitle>
          <SheetDescription className="text-sm text-ink-soft">Prime Trajectory</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4 text-base text-ink">
          <p>
            The number is the average of your Prime Score over the last {trajectory.windowDays} days. Only days with an
            evening check-in count. You have logged {trajectory.loggedDays} of {trajectory.windowDays}; days without a
            check-in are left out, not counted as zero.
          </p>
          <p>Fewer than 3 logged days shows Building instead of a number.</p>
          <p>
            Each pillar bar is the average of that pillar&apos;s percent over the same days. The pillars weigh
            differently in the score (Health 30, Identity 30, Relationships 20, Purpose 20) so the bars show
            consistency, not points.
          </p>
          <p>
            Direction compares the average of the last 14 logged days with the 14 before. Up by 3 or more is Rising,
            down by 3 or more is Easing, anything between is Steady.
            {trajectory.delta != null ? ` Right now the difference is ${trajectory.delta > 0 ? "+" : ""}${trajectory.delta}.` : ""}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
