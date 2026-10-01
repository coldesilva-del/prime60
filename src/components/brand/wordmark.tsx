import Link from "next/link";
import { cn } from "cn";

/** The Prime 60 wordmark: serif numeral with a small sans "Prime". */
export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="text-sm font-medium tracking-wide text-ink-soft">Prime</span>
      <span className="font-display text-2xl text-brass">60</span>
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} aria-label="Prime 60 home" className="inline-flex">
      {mark}
    </Link>
  );
}
