import { cn } from "cn";
import { ChartSummary } from "./chart-summary";
import { linePath, niceDomain, positionPoints, type DatedPoint } from "./scale";

interface SparklineProps {
  points: DatedPoint[];
  summary: string;
  title: string;
  width?: number;
  height?: number;
  className?: string;
}

/** A small harbour line with no axes. The summary carries the numbers. */
export function Sparkline({ points, summary, title, width = 96, height = 28, className }: SparklineProps) {
  const id = `spark-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const domain = niceDomain(points.map((p) => p.value), 2);
  const placed = positionPoints(points, domain);
  const last = placed[placed.length - 1];
  return (
    <figure className={cn("space-y-1", className)} aria-labelledby={`${id}-title`} aria-describedby={id}>
      <figcaption id={`${id}-title`} className="sr-only">
        {title}
      </figcaption>
      <div className="relative" style={{ width, height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
          focusable="false"
        >
          {placed.length > 1 ? (
            <path
              d={linePath(placed)}
              fill="none"
              className="stroke-harbour"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {last ? (
          <span
            aria-hidden
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-harbour"
            style={{ left: `${last.x}%`, top: `${last.y}%` }}
          />
        ) : null}
      </div>
      <ChartSummary id={id} summary={summary} />
    </figure>
  );
}
