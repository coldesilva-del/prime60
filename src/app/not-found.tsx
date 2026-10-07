import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[520px] px-5 pt-6">
        <Wordmark />
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 space-y-6 px-5 pb-10 pt-10">
        <h1 className="font-display text-3xl text-ink">That page is not here.</h1>
        <p className="measure text-base text-ink-soft">
          The address may be mistyped, or the page may have moved. Nothing you have saved is affected.
        </p>
        <div className="space-y-3">
          <ButtonLink href="/today" size="full">
            Go to Today
          </ButtonLink>
          <ButtonLink href="/" size="full" variant="secondary">
            Go to the front page
          </ButtonLink>
        </div>
        <p className="text-sm text-ink-soft">
          Looking for help? The{" "}
          <Link href="/more/guide" className="text-harbour underline-offset-4 hover:underline">
            guide
          </Link>{" "}
          explains every screen.
        </p>
      </main>
    </div>
  );
}
