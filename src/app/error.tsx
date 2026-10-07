"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Catches a render or data error anywhere in the app and offers a way back.
 * The error itself goes to the server logs through Next's reporting; here we
 * only keep the message out of the page.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[520px] px-5 pt-6">
        <Wordmark />
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 space-y-6 px-5 pb-10 pt-10">
        <h1 className="font-display text-3xl text-ink">Something went wrong on our side.</h1>
        <p className="measure text-base text-ink-soft">
          Nothing you tapped has been lost. Try again, or go back to Today. If it keeps happening, sign out and
          sign back in.
        </p>
        <div className="space-y-3">
          <Button type="button" size="full" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/today" size="full" variant="secondary">
            Go to Today
          </ButtonLink>
        </div>
        {error.digest ? (
          <p className="text-sm text-ink-soft">
            Reference {error.digest}. Quote it if you{" "}
            <Link href="/more/account" className="text-harbour underline-offset-4 hover:underline">
              contact us
            </Link>
            .
          </p>
        ) : null}
      </main>
    </div>
  );
}
