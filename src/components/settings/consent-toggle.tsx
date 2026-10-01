"use client";

import { useId, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setMarketingConsentAction } from "@/lib/account/actions";

interface ConsentToggleProps {
  checked: boolean;
}

/** Marketing consent. Saves at once, then syncs Mailchimp in the background. */
export function ConsentToggle({ checked }: ConsentToggleProps) {
  const id = useId();
  const [value, setValue] = useState(checked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await setMarketingConsentAction(next);
      if (result.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2">
        <span className="text-base text-ink">Send me occasional emails from Colin about Prime 60</span>
        <Switch id={id} checked={value} onCheckedChange={change} disabled={pending} className="shrink-0" />
      </label>
      <p className="text-sm text-ink-soft">
        Only your email and first name are shared with the mailing list. Turn this off any time.
      </p>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
