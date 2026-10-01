import { notFound, redirect } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/progress-bar";
import { onboardingComplete, requireProfile } from "@/lib/profile";
import { parseStep } from "@/lib/onboarding/steps";

export default async function WelcomeStepLayout({ children, params }: LayoutProps<"/welcome/[step]">) {
  const { step } = await params;
  const profile = await requireProfile();
  if (onboardingComplete(profile)) redirect("/today");

  const current = parseStep(step);
  if (!current) notFound();

  return (
    <div className="space-y-8">
      <OnboardingProgress step={current} />
      {children}
    </div>
  );
}
