import Link from "next/link";
import { Button } from "@/components/ui/button";
import { stepHref, type StepNumber } from "@/lib/onboarding/steps";
import { cn } from "cn";

interface StepShellProps {
  title: string;
  lede?: string;
  children: React.ReactNode;
  className?: string;
}

/** One question per screen: a heading, an optional line of context, then the form. */
export function StepShell({ title, lede, children, className }: StepShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {lede ? <p className="measure text-base text-ink-soft">{lede}</p> : null}
      </header>
      {children}
    </div>
  );
}

interface StepActionsProps {
  step: StepNumber;
  pending: boolean;
  continueLabel?: string;
  pendingLabel?: string;
  /** Rendered beside Back, for steps that allow skipping. */
  secondary?: React.ReactNode;
}

/** Continue on top, Back (and an optional secondary action) beneath. Every target is 44px or taller. */
export function StepActions({ step, pending, continueLabel = "Continue", pendingLabel = "Saving", secondary }: StepActionsProps) {
  return (
    <div className="space-y-3 pt-2">
      <Button type="submit" size="full" disabled={pending}>
        {pending ? pendingLabel : continueLabel}
      </Button>
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <Link
            href={stepHref(step - 1)}
            className="-ml-2 inline-flex h-11 items-center rounded-[10px] px-2 text-sm text-ink-soft outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back
          </Link>
        ) : (
          <span />
        )}
        {secondary}
      </div>
    </div>
  );
}

/** A small note under a control. */
export function StepNote({ children, tone = "soft" }: { children: React.ReactNode; tone?: "soft" | "error" }) {
  return (
    <p className={cn("text-sm", tone === "error" ? "text-ember" : "text-ink-soft")} role={tone === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
