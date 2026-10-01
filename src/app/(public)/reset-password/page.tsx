import type { Metadata } from "next";
import Link from "next/link";
import { EmailForm } from "@/components/forms/email-form";
import { resetPasswordAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Reset your password" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Reset your password</h1>
        <p className="text-base text-ink-soft">
          Enter your email and we will send a link to choose a new password.
        </p>
      </div>
      <EmailForm action={resetPasswordAction} submitLabel="Send reset link" pendingLabel="Sending" />
      <p className="text-sm text-ink-soft">
        <Link href="/sign-in" className="text-harbour underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
