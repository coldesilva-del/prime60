import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
      <Wordmark href={null} />
      <div className="mt-10 space-y-8">
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-ink">Choose a new password</h1>
          <p className="text-base text-ink-soft">At least 10 characters.</p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
