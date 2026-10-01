import { redirect } from "next/navigation";
import { TabBar } from "@/components/nav/tab-bar";
import { onboardingComplete, requireProfile } from "@/lib/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!onboardingComplete(profile)) {
    redirect(`/welcome/${Math.min(Math.max(profile.onboarding_step, 1), 9)}`);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-[520px] flex-1 px-5 pb-28 pt-6">{children}</main>
      <TabBar />
    </div>
  );
}
