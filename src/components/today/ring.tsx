import { Check } from "lucide-react";
import { cn } from "cn";

/**
 * The 28px completion ring used on commitment rows, The One Thing and the intent rows.
 * Fills harbour over 180ms when done. Decorative; the owning control carries the state.
 */
export function Ring({ done, className }: { done: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color] duration-[180ms] ease-out",
        done ? "border-harbour bg-harbour text-primary-foreground" : "border-hairline bg-transparent text-transparent",
        className,
      )}
    >
      <Check className="size-4" strokeWidth={2.5} />
    </span>
  );
}
