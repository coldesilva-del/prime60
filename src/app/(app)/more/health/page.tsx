import type { Metadata } from "next";
import { HealthSettingsForm } from "@/components/health/health-settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { getHealthTargets } from "@/lib/health/queries";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Health settings" };

export default async function HealthSettingsPage() {
  const [profile, targets] = await Promise.all([requireProfile(), getHealthTargets()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Health" backHref="/more" description="Mode, fields, targets and programme." />
      <HealthSettingsForm mode={profile.health_mode} weighInDow={profile.weigh_in_dow} targets={targets} />
    </div>
  );
}
