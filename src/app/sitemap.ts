import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Only the public pages. Signed-in screens are excluded on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.NEXT_PUBLIC_APP_URL;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/letter`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/scorecard`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/install`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
