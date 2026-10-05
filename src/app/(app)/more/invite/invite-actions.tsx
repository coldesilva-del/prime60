"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

interface InviteActionsProps {
  url: string;
  message: string;
}

const noSubscription = () => () => {};

/** Share through the phone's share sheet where there is one; copy otherwise. */
export function InviteActions({ url, message }: InviteActionsProps) {
  const [copied, setCopied] = useState(false);
  // False on the server and during hydration, then the real answer.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  async function share() {
    try {
      await navigator.share({ title: "Prime 60", text: message, url });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${message} ${url}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      {canShare ? (
        <Button type="button" size="full" onClick={share}>
          Send the invitation
        </Button>
      ) : null}
      <Button type="button" size="full" variant={canShare ? "secondary" : "default"} onClick={copy}>
        Copy the message
      </Button>
      <p className="min-h-5 text-sm text-ink-soft" aria-live="polite">
        {copied ? "Copied. Paste it into a text or an email." : ""}
      </p>
    </div>
  );
}
