import Link from "next/link";
import { PageView } from "@/components/analytics/page-view";
import { Wordmark } from "@/components/brand/wordmark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageView />
      <header className="mx-auto w-full max-w-[520px] px-5 pt-6">
        <Wordmark />
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 px-5 pb-10 pt-10">{children}</main>
      <footer className="mx-auto w-full max-w-[520px] px-5 pb-8 text-xs text-ink-faint">
        <nav className="flex gap-4" aria-label="Legal">
          <Link href="/privacy" className="hover:text-ink-soft">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink-soft">
            Terms
          </Link>
          <Link href="/letter" className="hover:text-ink-soft">
            Letter
          </Link>
          <Link href="/scorecard" className="hover:text-ink-soft">
            Scorecard
          </Link>
          <Link href="/install" className="hover:text-ink-soft">
            Install on iPhone
          </Link>
        </nav>
        <p className="mt-3">Prime 60 by Colin de Silva.</p>
      </footer>
    </div>
  );
}
