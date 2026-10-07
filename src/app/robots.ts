import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_APP_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/letter", "/scorecard", "/install", "/privacy", "/terms", "/sign-up", "/sign-in"],
        // Everything behind sign-in is personal and must never be indexed.
        disallow: ["/today", "/progress", "/plan", "/vision", "/more", "/welcome", "/auth", "/api", "/update-password"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
