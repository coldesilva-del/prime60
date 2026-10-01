import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PromptBannerProps {
  text: string;
  href: string;
  actionLabel: string;
}

/** One line, one action, surface-raised. Only one is shown at a time on Today. */
export function PromptBanner({ text, href, actionLabel }: PromptBannerProps) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-between gap-4 rounded-[16px] bg-surface-raised px-4 py-3 text-ink transition-colors hover:bg-hairline/60"
    >
      <span className="text-base">{text}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-harbour">
        {actionLabel}
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
    </Link>
  );
}
