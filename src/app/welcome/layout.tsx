import { Wordmark } from "@/components/brand/wordmark";
import { requireProfile } from "@/lib/profile";

/**
 * Onboarding shell: signed in, no tab bar, 520px max width, 20px gutters.
 * The step layout beneath handles the progress bar and the completed redirect
 * so the community screen can live alongside the steps.
 */
export default async function WelcomeLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[520px] px-5 pt-6">
        <Wordmark href={null} />
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 px-5 pb-16 pt-6">{children}</main>
    </div>
  );
}
