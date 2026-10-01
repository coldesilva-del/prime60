import Link from "next/link";
import { cn } from "cn";
import { PERIODS, periodLabel, type Period } from "@/lib/progress/periods";

interface PeriodSelectorProps {
  basePath: string;
  period: Period;
  className?: string;
}

/** A row of pill links. The period lives in the URL so every sub-page shares it. */
export function PeriodSelector({ basePath, period, className }: PeriodSelectorProps) {
  return (
    <nav aria-label="Period" className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-ink-soft">Period</span>
      <ul className="flex gap-1">
        {PERIODS.map((p) => {
          const active = p === period;
          return (
            <li key={String(p)}>
              <Link
                href={`${basePath}?period=${p}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors",
                  active ? "bg-harbour-soft text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {periodLabel(p)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
