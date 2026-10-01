import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { IdentityList } from "@/components/settings/identity-list";
import { getIdentityStatements } from "@/lib/account/queries";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Identity statements" };

export default async function IdentityPage() {
  const profile = await requireProfile();
  const statements = await getIdentityStatements(profile.user_id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Identity statements"
        backHref="/more"
        description="Short sentences about the man you are becoming. The primary one appears on Today."
      />
      <IdentityList statements={statements} />
    </div>
  );
}
