"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { seedGroupsAction } from "@/lib/relationships/actions";

/** Shown only when onboarding did not create the five groups. */
export function SeedGroupsButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();
  return (
    <div className="space-y-2">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await seedGroupsAction();
            setError(result.error);
          })
        }
      >
        Set up groups
      </Button>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
    </div>
  );
}
