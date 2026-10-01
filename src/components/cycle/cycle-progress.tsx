import { formatDayShort } from "@/lib/dates";
import {
  cycleDayNumber,
  cycleDaysRemaining,
  cycleHasEnded,
  cycleLength,
  cycleProgress,
} from "@/lib/cycles/dates";

interface CycleProgressProps {
  startsOn: string;
  endsOn: string;
  today: string;
}

/** Days remaining in sans 30, a thin harbour bar beneath. */
export function CycleProgress({ startsOn, endsOn, today }: CycleProgressProps) {
  const remaining = cycleDaysRemaining(endsOn, today);
  const day = cycleDayNumber(startsOn, endsOn, today);
  const total = cycleLength(startsOn, endsOn);
  const pct = Math.round(cycleProgress(startsOn, endsOn, today) * 100);
  const ended = cycleHasEnded(endsOn, today);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-2xl font-medium text-ink">
          {ended ? "Cycle ended" : `${remaining} ${remaining === 1 ? "day" : "days"} left`}
        </p>
        <p className="text-sm text-ink-soft">
          {ended ? formatDayShort(endsOn) : `Day ${day} of ${total}`}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Cycle progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-[3px] w-full overflow-hidden rounded-full bg-hairline"
      >
        <div className="h-full rounded-full bg-harbour" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-ink-soft">
        {formatDayShort(startsOn)} to {formatDayShort(endsOn)}
        {ended ? ". Close it to start the next one." : ""}
      </p>
    </div>
  );
}
