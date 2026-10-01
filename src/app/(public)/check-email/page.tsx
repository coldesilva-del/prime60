import type { Metadata } from "next";
import Link from "next/link";
import { EmailForm } from "@/components/forms/email-form";
import { resendVerificationAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Check your email" };

const copy = {
  verify: {
    title: "Check your email",
    body: "We sent a verification link. Tap it on this phone and you will land in Prime 60, ready to begin.",
  },
  magic: {
    title: "Check your email",
    body: "If that address has an account, a sign-in link is on its way. Open it on this device.",
  },
  reset: {
    title: "Check your email",
    body: "If that address has an account, a reset link is on its way. It expires in an hour.",
  },
} as const;

export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const params = await searchParams;
  const purpose = (typeof params.purpose === "string" ? params.purpose : "verify") as keyof typeof copy;
  const email = typeof params.email === "string" ? params.email : "";
  const text = copy[purpose] ?? copy.verify;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">{text.title}</h1>
        <p className="text-base text-ink-soft">{text.body}</p>
        {email ? <p className="text-sm text-ink">{email}</p> : null}
      </div>
      <p className="text-sm text-ink-soft">
        Nothing after a couple of minutes? Check spam, then try again below.
      </p>
      {purpose === "verify" ? (
        <EmailForm
          action={resendVerificationAction}
          submitLabel="Send the link again"
          pendingLabel="Sending"
          defaultEmail={email}
        />
      ) : null}
      <p className="text-sm text-ink-soft">
        <Link href="/sign-in" className="text-harbour underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
