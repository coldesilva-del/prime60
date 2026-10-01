import { cn } from "cn";
import { formatDayShort } from "@/lib/dates";
import { ChartSummary } from "./chart-summary";
import { formatTick, linePath, niceDomain, positionPoints, yPos, type DatedPoint } from "./scale";

interface ReferenceLine {
  value: number;
  label?: string;
}

interface Band {
  low: number;
  high: number;
  label?: string;
}

interface LineChartProps {
  /** One series, dated. Unsorted input is fine. */
  points: DatedPoint[];
  /** Dashed ink-faint reference line, e.g. a target weight. */
  target?: ReferenceLine;
  /** A target band, e.g. body fat low to high. */
  band?: Band;
  /** Plain-language description, read by screen readers and shown as a caption. */
  summary: string;
  /** Accessible title for the chart. */
  title: string;
  unit?: string;
  height?: number;
  /** Hint so the axis always includes these values (e.g. 0 and 100 for scores). */
  include?: number[];
  formatValue?: (n: number) => string;
  className?: string;
}

/**
 * Single harbour line on hairline gridlines, server-renderable plain SVG.
 * The plot stretches to its container in 0..100 space; strokes keep their
 * pixel width with vector-effect. Labels are 13px sans in HTML so they never
 * scale with the plot. The axis always rises, so a target above the data sits
 * above the line and a target below sits below, whichever way the man is going.
 */
export function LineChart({
  points,
  target,
  band,
  summary,
  title,
  unit,
  height = 160,
  include = [],
  formatValue = formatTick,
  className,
}: LineChartProps) {
  const id = `chart-${slug(title)}`;
  const values = points.map((p) => p.value);
  const extras = [...include];
  if (target) extras.push(target.value);
  if (band) extras.push(band.low, band.high);
  const domain = niceDomain([...values, ...extras]);
  const placed = positionPoints(points, domain);
  const last = placed[placed.length - 1];
  const targetY = target ? yPos(target.value, domain) : null;
  // Direction-aware label placement: the target label sits on the far side of
  // the line from the data so it reads correctly whether the target is above or below.
  const targetLabelAbove = targetY !== null && last ? targetY <= last.y : true;
  const unitSuffix = unit ? ` ${unit}` : "";

  return (
    <figure className={cn("space-y-2", className)} aria-labelledby={`${id}-title`} aria-describedby={id}>
      <figcaption id={`${id}-title`} className="sr-only">
        {title}
      </figcaption>
      <div className="flex gap-3">
        <div className="relative w-10 shrink-0 text-right text-xs text-ink-faint" style={{ height }} aria-hidden>
          {domain.ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 leading-none"
              style={{ top: `${yPos(t, domain)}%` }}
            >
              {formatValue(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
            focusable="false"
          >
            {band ? (
              <rect
                x={0}
                y={yPos(Math.max(band.low, band.high), domain)}
                width={100}
                height={Math.abs(yPos(band.low, domain) - yPos(band.high, domain))}
                className="fill-harbour-soft"
              />
            ) : null}
            {domain.ticks.map((t) => (
              <line
                key={t}
                x1={0}
                x2={100}
                y1={yPos(t, domain)}
                y2={yPos(t, domain)}
                className="stroke-hairline"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {band ? (
              <>
                <line
                  x1={0}
                  x2={100}
                  y1={yPos(band.low, domain)}
                  y2={yPos(band.low, domain)}
                  className="stroke-ink-faint"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={0}
                  x2={100}
                  y1={yPos(band.high, domain)}
                  y2={yPos(band.high, domain)}
                  className="stroke-ink-faint"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : null}
            {targetY !== null ? (
              <line
                x1={0}
                x2={100}
                y1={targetY}
                y2={targetY}
                className="stroke-ink-faint"
                strokeWidth={1.5}
                strokeDasharray="6 5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
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
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-harbour ring-2 ring-paper"
              style={{ left: `${last.x}%`, top: `${last.y}%` }}
            />
          ) : null}
          {last ? (
            <span
              aria-hidden
              className={cn(
                "absolute right-0 text-xs font-medium text-ink",
                last.y > 85 ? "-translate-y-full pb-1" : "pt-2",
              )}
              style={{ top: `${last.y}%` }}
            >
              {formatValue(last.value)}
              {unitSuffix}
            </span>
          ) : null}
          {target && targetY !== null ? (
            <span
              aria-hidden
              className={cn(
                "absolute left-0 text-xs text-ink-faint",
                targetLabelAbove ? "-translate-y-full pb-1" : "pt-1",
              )}
              style={{ top: `${targetY}%` }}
            >
              {target.label ?? `Target ${formatValue(target.value)}${unitSuffix}`}
            </span>
          ) : null}
          {band?.label ? (
            <span
              aria-hidden
              className="absolute left-0 -translate-y-full pb-1 text-xs text-ink-faint"
              style={{ top: `${yPos(Math.max(band.low, band.high), domain)}%` }}
            >
              {band.label}
            </span>
          ) : null}
          {placed.length === 0 ? (
            <span className="absolute inset-0 flex items-center justify-center text-sm text-ink-faint">
              Nothing logged yet
            </span>
          ) : null}
        </div>
      </div>
      {placed.length > 0 ? (
        <div className="flex justify-between pl-[52px] text-xs text-ink-faint" aria-hidden>
          <span>{formatDayShort(placed[0].date)}</span>
          {placed.length > 1 ? <span>{formatDayShort(placed[placed.length - 1].date)}</span> : null}
        </div>
      ) : null}
      <ChartSummary id={id} summary={summary} />
    </figure>
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
