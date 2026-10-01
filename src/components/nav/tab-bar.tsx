"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, TrendingUp, Map, Compass, Ellipsis } from "lucide-react";
import { cn } from "cn";

const tabs = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/plan", label: "Plan", icon: Map },
  { href: "/vision", label: "Vision", icon: Compass },
  { href: "/more", label: "More", icon: Ellipsis },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80"
    >
      <ul className="mx-auto flex max-w-[520px] items-stretch justify-between px-2 safe-bottom">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-harbour" : "text-ink-faint hover:text-ink-soft",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-[3px] w-8 rounded-full bg-harbour transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
