import type { Metadata } from "next";
import { requireProfile } from "@/lib/profile";
import { getSnippetsByPrefix } from "@/lib/content";
import { STUCK_WHY_FALLBACKS, STUCK_WHY_KEYS } from "@/lib/stuck/schemas";
import { StuckFlow } from "./stuck-flow";

export const metadata: Metadata = { title: "I'm stuck" };

export default async function StuckPage() {
  await requireProfile();
  const snippets = await getSnippetsByPrefix("stuck_why_");
  const whyOptions = STUCK_WHY_KEYS.map((key) => ({
    key,
    label: snippets[`stuck_why_${key}`] || STUCK_WHY_FALLBACKS[key],
  }));

  return <StuckFlow whyOptions={whyOptions} />;
}
