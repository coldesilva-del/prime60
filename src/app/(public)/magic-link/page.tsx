import type { Metadata } from "next";
import Link from "next/link";
import { EmailForm } from "@/components/forms/email-form";
import { magicLinkAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Email me a link" };

export default function MagicLinkPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Email me a sign-in link</h1>
        <p className="text-base text-ink-soft">
          No password needed. We send a link that signs you in on this device.
        </p>
      </div>
      <EmailForm action={magicLinkAction} submitLabel="Send the link" pendingLabel="Sending" />
      <p className="text-sm text-ink-soft">
        <Link href="/sign-in" className="text-harbour underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
