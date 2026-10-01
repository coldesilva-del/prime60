"use client";

import { cn } from "cn";

interface YesNoProps {
  name: string;
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  className?: string;
}

/** Two equal 48px segments. No sliders, no switches. */
export function YesNo({ name, label, value, onChange, yesLabel = "Yes", noLabel = "No", className }: YesNoProps) {
  const base =
    "h-12 flex-1 text-[15px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="text-base text-ink" id={`${name}-label`}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        className="flex w-[152px] shrink-0 overflow-hidden rounded-[10px] border border-hairline bg-surface"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          onClick={() => onChange(true)}
          className={cn(base, value === true ? "bg-harbour text-primary-foreground" : "text-ink-soft hover:bg-surface-raised")}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          onClick={() => onChange(false)}
          className={cn(
            base,
            "border-l border-hairline",
            value === false ? "bg-surface-raised text-ink" : "text-ink-soft hover:bg-surface-raised",
          )}
        >
          {noLabel}
        </button>
      </div>
      <input type="hidden" name={name} value={value === null ? "" : value ? "true" : "false"} />
    </div>
  );
}
