import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "cn";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
  /** Use the serif for emotional screens (Vision, reviews). Sans by default. */
  display?: boolean;
}

export function PageHeader({ title, eyebrow, description, backHref, action, className, display }: PageHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="-ml-2 inline-flex h-11 items-center gap-1 pr-2 text-sm text-ink-soft hover:text-ink"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
          Back
        </Link>
      ) : null}
      {eyebrow ? <p className="text-sm text-ink-soft">{eyebrow}</p> : null}
      <div className="flex items-start justify-between gap-4">
        <h1 className={cn(display ? "font-display text-3xl" : "text-2xl font-semibold tracking-tight", "text-ink")}>
          {title}
        </h1>
        {action}
      </div>
      {description ? <p className="measure text-base text-ink-soft">{description}</p> : null}
    </header>
  );
}
