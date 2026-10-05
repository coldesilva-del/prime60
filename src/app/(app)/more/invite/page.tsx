import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { publicEnv } from "@/lib/env";
import { getFoundingPlacesLeft } from "@/lib/founding";
import { InviteActions } from "./invite-actions";

export const metadata: Metadata = { title: "Invite a friend" };

const MESSAGE =
  "I have started using Prime 60, a five-minute daily system for men our age. It is free for the first 100 members. I thought of you. Colin's letter explains it:";

export default async function InvitePage() {
  const left = await getFoundingPlacesLeft();
  const url = `${publicEnv.NEXT_PUBLIC_APP_URL}/letter`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invite a friend"
        backHref="/more"
        description="This is easier to keep up when one other man is doing it too."
      />

      <div className="space-y-3">
        <p className="measure text-base text-ink">
          Think of one man who would want this: a brother, a mate, a colleague. Send him the invitation below. He
          reads a short letter from Colin and decides for himself.
        </p>
        {left !== null && left > 0 ? (
          <p className="measure text-base text-ink-soft">
            {left} founding places are left. If he joins while they last, he is free for life as well.
          </p>
        ) : null}
      </div>

      <blockquote className="measure rounded-[16px] bg-surface px-4 py-4 text-base text-ink">
        {MESSAGE} <span className="break-all text-harbour">{url}</span>
      </blockquote>

      <InviteActions url={url} message={MESSAGE} />

      <p className="measure text-sm text-ink-soft">
        Nothing is sent from Prime 60. You send it yourself, and we never see who you invited.
      </p>
    </div>
  );
}
