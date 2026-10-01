import { cn } from "cn";

interface ChartSummaryProps {
  id: string;
  summary: string;
  className?: string;
}

/**
 * Every chart carries a text summary: once for screen readers (referenced by
 * aria-describedby) and once as a quiet caption line under the chart.
 */
export function ChartSummary({ id, summary, className }: ChartSummaryProps) {
  return (
    <>
      <p id={id} className="sr-only">
        {summary}
      </p>
      <p aria-hidden className={cn("text-xs text-ink-soft", className)}>
        {summary}
      </p>
    </>
  );
}
