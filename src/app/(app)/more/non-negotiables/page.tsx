import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Group, Section } from "@/components/layout/section";
import { NonNegotiableEditor } from "@/components/settings/non-negotiable-editor";
import { getNonNegotiableCatalogue, getStandingNonNegotiables } from "@/lib/account/queries";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Non-negotiables" };

export default async function NonNegotiablesPage() {
  const profile = await requireProfile();
  const [slots, catalogue] = await Promise.all([
    getStandingNonNegotiables(profile.user_id),
    getNonNegotiableCatalogue(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Non-negotiables"
        backHref="/more"
        description="Three standing commitments you keep every day. Each one feeds a pillar of your Prime Score."
      />
      <Section>
        <Group>
          {([1, 2, 3] as const).map((slot) => (
            <NonNegotiableEditor key={slot} slot={slot} current={slots[slot - 1]} catalogue={catalogue} />
          ))}
        </Group>
      </Section>
      <p className="text-sm text-ink-soft">
        Keep them small enough to do on a hard day. You can override them for a single morning from Today.
      </p>
    </div>
  );
}
