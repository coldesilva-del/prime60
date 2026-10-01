import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CommunityScreen } from "@/components/onboarding/community-screen";
import { serverEnv } from "@/lib/env";
import { resumeStep, stepHref } from "@/lib/onboarding/steps";
import { onboardingComplete, requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Join the community" };

/** Shown once, straight after step 9, when a Skool invite is configured. */
export default async function CommunityPage() {
  const profile = await requireProfile();
  if (!onboardingComplete(profile)) redirect(stepHref(resumeStep(profile.onboarding_step)));

  const inviteUrl = serverEnv().SKOOL_INVITE_URL;
  if (!inviteUrl) redirect("/today");

  return <CommunityScreen inviteUrl={inviteUrl} firstName={profile.first_name} />;
}
