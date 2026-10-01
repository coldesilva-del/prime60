import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PatternSettings } from "@/components/patterns/pattern-settings";
import { requireProfile } from "@/lib/profile";
import { getPatternsForUser } from "@/lib/patterns/queries";

export const metadata: Metadata = { title: "Patterns" };

export default async function PatternsPage() {
  const profile = await requireProfile();
  const patterns = await getPatternsForUser(profile.user_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patterns"
        backHref="/more"
        description="Pick up to five to keep in focus. Open one to write your own replacement and IF-THEN plan."
      />
      <PatternSettings patterns={patterns} />
    </div>
  );
}
