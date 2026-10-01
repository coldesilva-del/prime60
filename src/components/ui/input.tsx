import * as React from "react";
import { cn } from "cn";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-[10px] border border-hairline bg-surface px-4 text-base text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] focus-visible:border-harbour focus-visible:ring-2 focus-visible:ring-harbour/30 disabled:opacity-50 aria-invalid:border-ember",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
