import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-[10px] border border-hairline bg-surface px-4 py-3 text-base leading-relaxed text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] focus-visible:border-harbour focus-visible:ring-2 focus-visible:ring-harbour/30 disabled:opacity-50 aria-invalid:border-ember",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
