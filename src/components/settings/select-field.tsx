import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

interface SelectFieldProps extends React.ComponentProps<"select"> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  /** Rendered to the right of the label, for example a detect button. */
  labelAction?: React.ReactNode;
}

/** Native select styled like Input. Native pickers work best on phones. */
export function SelectField({ label, name, error, hint, labelAction, className, id, children, ...props }: SelectFieldProps) {
  const selectId = id ?? name;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={selectId}>{label}</Label>
        {labelAction}
      </div>
      <div className="relative">
        <select
          id={selectId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className="h-12 w-full appearance-none rounded-[10px] border border-hairline bg-surface pl-4 pr-11 text-base text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-harbour focus-visible:ring-2 focus-visible:ring-harbour/30 disabled:opacity-50 aria-invalid:border-ember"
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
