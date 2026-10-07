"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one cookieless beacon per public page view: the path and the
 * referring site. See /api/view for what is kept.
 */
export function PageView() {
  const pathname = usePathname();
  useEffect(() => {
    const body = JSON.stringify({ path: pathname, referrer: document.referrer });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/view", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/view", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch {
      // Never let counting affect the page.
    }
  }, [pathname]);
  return null;
}
