"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markCommunitySeen } from "@/lib/onboarding/actions";

interface CommunityScreenProps {
  inviteUrl: string;
  firstName: string | null;
}

/** Shown once after onboarding. Open goes to the community in a new tab; both buttons land on Today. */
export function CommunityScreen({ inviteUrl, firstName }: CommunityScreenProps) {
  const [pending, startTransition] = useTransition();

  function recordSeen() {
    startTransition(async () => {
      await markCommunitySeen();
    });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {firstName ? `${firstName}, you are set.` : "You are set."}
        </h1>
        <p className="font-display text-xl text-ink">Join the Prime 60 community.</p>
        <p className="measure text-base text-ink-soft">
          Other men doing the same work, and Colin, in one place. Questions, weekly check-ins and the occasional
          hard conversation. Free for members.
        </p>
      </header>
      <div className="space-y-3">
        <Button
          size="full"
          disabled={pending}
          render={<a href={inviteUrl} target="_blank" rel="noopener noreferrer" />}
          onClick={recordSeen}
        >
          Open the community
        </Button>
        <Button type="button" variant="ghost" size="full" disabled={pending} onClick={recordSeen}>
          {pending ? "Opening Today" : "Later"}
        </Button>
      </div>
    </div>
  );
}
