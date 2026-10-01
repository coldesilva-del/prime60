"use client";

import { cn } from "cn";

interface RatingRowProps {
  name: string;
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}

/** A row of 1 to 10 targets, each at least 32px wide and 44px tall. */
export function RatingRow({ name, label, value, onChange, max = 10, className }: RatingRowProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-base text-ink" id={`${name}-label`}>
          {label}
        </span>
        <span className="text-sm text-ink-soft" aria-live="polite">
          {value ?? "–"} of {max}
        </span>
      </div>
      <div role="radiogroup" aria-labelledby={`${name}-label`} className="grid grid-cols-10 gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}`}
            onClick={() => onChange(n)}
            className={cn(
              "h-11 rounded-[8px] text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === n
                ? "bg-harbour text-primary-foreground"
                : value != null && n < value
                  ? "bg-harbour-soft text-ink"
                  : "bg-surface text-ink-soft hover:bg-surface-raised",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}
