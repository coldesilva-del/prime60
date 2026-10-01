import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Hairline, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/settings/account-form";
import { ConsentToggle } from "@/components/settings/consent-toggle";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ThemePicker } from "@/components/theme/theme-picker";
import { getUserEmail } from "@/lib/account/queries";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [profile, email] = await Promise.all([requireProfile(), getUserEmail()]);

  return (
    <div className="space-y-10">
      <PageHeader title="Account" backHref="/more" description={email ?? undefined} />

      <Section title="Plan">
        {profile.plan === "founding" && profile.founding_number ? (
          <p className="text-base text-brass">Founding member {profile.founding_number} of 100. Free for life.</p>
        ) : (
          <p className="text-base text-ink">Early access.</p>
        )}
      </Section>

      <Hairline />

      <Section title="Profile">
        <AccountForm profile={profile} />
      </Section>

      <Hairline />

      <Section title="Appearance">
        <ThemePicker value={profile.theme} />
      </Section>

      <Hairline />

      <Section title="Rhythm">
        <PreferencesForm profile={profile} />
      </Section>

      <Hairline />

      <Section title="Email">
        <ConsentToggle checked={profile.marketing_consent} />
      </Section>

      <Hairline />

      <Section title="Your data" description="Everything you have entered, as one JSON file. Health and relationship data never leave Prime 60 except in this export.">
        <Button variant="secondary" size="full" render={<a href="/api/export" download />}>
          Export my data
        </Button>
      </Section>

      <Hairline />

      <Section title="Delete account" description="Permanent. Removes every row you own. Export first if you want a copy.">
        <DeleteAccountDialog />
      </Section>
    </div>
  );
}
