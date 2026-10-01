"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

interface SegmentedNavProps {
  items: { href: string; label: string }[];
  ariaLabel: string;
  className?: string;
}

/** Link-based segmented control for sub-views (Plan, Progress). */
export function SegmentedNav({ items, ariaLabel, className }: SegmentedNavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label={ariaLabel} className={cn("-mx-5 overflow-x-auto px-5", className)}>
      <ul className="flex w-max gap-1 rounded-[12px] bg-surface p-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-[9px] px-4 text-sm font-medium transition-colors",
                  active ? "bg-surface-raised text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
