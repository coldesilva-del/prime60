import { DIRECTION_GLYPH, DIRECTION_WORD, plural } from "@/lib/progress/metrics";
import type { Trajectory } from "@/lib/scoring/trajectory";

interface TrajectoryBlockProps {
  trajectory: Trajectory;
}

/**
 * The 28-day number in sans 30px with a direction word beside it. The arrow is
 * the only glyph; the word carries the meaning. No colour for direction.
 */
export function TrajectoryBlock({ trajectory }: TrajectoryBlockProps) {
  const { value, direction, loggedDays, windowDays, unloggedDays } = trajectory;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold tracking-tight text-ink">{value === null ? "Building" : value}</span>
        {direction ? (
          <span className="text-base text-ink-soft">
            <span aria-hidden className="mr-1">
              {DIRECTION_GLYPH[direction]}
            </span>
            {DIRECTION_WORD[direction]}
            {trajectory.delta !== null ? (
              <span className="sr-only">
                , {trajectory.delta >= 0 ? "up" : "down"} {Math.abs(trajectory.delta)} points against the 14 days before
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-ink-soft">
        {value === null
          ? `Prime Trajectory needs 3 logged days in the last ${windowDays}. ${plural(loggedDays, "day")} so far.`
          : `Mean Prime Score over ${plural(loggedDays, "logged day")} in the last ${windowDays}${
              unloggedDays > 0 ? `, ${unloggedDays} not logged` : ""
            }.`}
      </p>
    </div>
  );
}
