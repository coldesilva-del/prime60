import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Create your account</h1>
        <p className="text-base text-ink-soft">
          Your data is private to you. Nothing here is shared.
        </p>
      </div>
      <SignUpForm />
      <p className="text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-harbour underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
