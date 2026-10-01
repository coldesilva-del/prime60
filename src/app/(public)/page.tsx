import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getUserId } from "@/lib/supabase/server";

export default async function LandingPage() {
  const userId = await getUserId();
  if (userId) redirect("/today");

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="font-display text-4xl text-ink">
          Build the man.
          <br />
          Build the life.
        </h1>
        <p className="measure text-base text-ink-soft">
          A personal operating system for the second half of your life. Define
          the man you intend to be in five years, then make every day a vote
          for him. Two minutes in the morning, three in the evening.
        </p>
      </div>
      <div className="space-y-3">
        <ButtonLink href="/sign-up" size="full">
          Create your account
        </ButtonLink>
        <ButtonLink href="/sign-in" size="full" variant="secondary">
          Sign in
        </ButtonLink>
      </div>
      <p className="text-sm text-ink-faint">
        The first 100 members are founding members, free for life.
      </p>
    </div>
  );
}
