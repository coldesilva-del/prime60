import { cn } from "cn";

interface BarRowProps {
  label: string;
  /** The number shown at the right, already formatted ("72%", "3 of 5"). */
  value: string;
  /** 0 to 100. Null draws an empty track. */
  percent: number | null;
  /** Optional plain-language line, read by screen readers and shown under the bar. */
  summary?: string;
  className?: string;
}

/**
 * Horizontal 6px harbour bar on a hairline track. Pillars and people are told
 * apart by label and position, never by colour.
 */
export function BarRow({ label, value, percent, summary, className }: BarRowProps) {
  const width = percent === null ? 0 : Math.min(100, Math.max(0, percent));
  const id = `bar-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-ink">{label}</span>
        <span className="text-sm tabular-nums text-ink-soft">{value}</span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${value}`}
        aria-describedby={summary ? id : undefined}
        className="h-1.5 w-full overflow-hidden rounded-full bg-hairline"
      >
        <div className="h-full rounded-full bg-harbour" style={{ width: `${width}%` }} />
      </div>
      {summary ? (
        <>
          <p id={id} className="sr-only">
            {summary}
          </p>
          <p aria-hidden className="text-xs text-ink-soft">
            {summary}
          </p>
        </>
      ) : null}
    </div>
  );
}
