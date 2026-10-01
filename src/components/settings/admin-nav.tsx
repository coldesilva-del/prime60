"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const items = [
  { href: "/more/admin", label: "Users", exact: true },
  { href: "/more/admin/content", label: "Content", exact: false },
];

/** Segmented control for the admin sub-views. Users matches exactly. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections">
      <ul className="flex w-max gap-1 rounded-[12px] bg-surface p-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-[9px] px-4 text-sm font-medium transition-colors",
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
