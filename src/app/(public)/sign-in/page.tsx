import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const linkError = params.error === "link";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Sign in</h1>
        {linkError ? (
          <p className="text-base text-ember" role="alert">
            That link has expired or was already used. Sign in, or request a new one.
          </p>
        ) : (
          <p className="text-base text-ink-soft">Welcome back.</p>
        )}
      </div>
      <SignInForm next={next} />
      <div className="space-y-2 text-sm text-ink-soft">
        <p>
          <Link href="/magic-link" className="text-harbour underline-offset-4 hover:underline">
            Email me a sign-in link instead
          </Link>
        </p>
        <p>
          <Link href="/reset-password" className="text-harbour underline-offset-4 hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p>
          New here?{" "}
          <Link href="/sign-up" className="text-harbour underline-offset-4 hover:underline">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
