import { redirect } from "next/navigation";
import { after } from "next/server";
import ActionSheet from "@/components/actions/action-sheet";
import { TabBar } from "@/components/nav/tab-bar";
import { ensureMailchimpSynced } from "@/lib/account/marketing";
import { onboardingComplete, requireProfile } from "@/lib/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!onboardingComplete(profile)) {
    redirect(`/welcome/${Math.min(Math.max(profile.onboarding_step, 1), 9)}`);
  }

  // Keeps the mailing list in step with consent. No-op unless they disagree;
  // runs after the response is sent so it never delays a screen.
  if (profile.marketing_consent !== (profile.mailchimp_synced_at !== null)) {
    after(() => ensureMailchimpSynced(profile));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-[520px] flex-1 px-5 pb-28 pt-6">{children}</main>
      <TabBar />
      <ActionSheet />
    </div>
  );
}
