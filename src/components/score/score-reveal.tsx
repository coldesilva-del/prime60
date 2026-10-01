"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { saveClosingLine } from "@/lib/daily/actions";
import { easeOut } from "@/lib/daily/helpers";
import { PILLAR_WEIGHTS, type BreakdownItem, type Pillar } from "@/lib/scoring/score";

const PILLARS: { key: Pillar; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "identity", label: "Identity" },
  { key: "relationships", label: "Relationships" },
  { key: "purpose", label: "Purpose" },
];

const NUMERAL_MS = 600;
const BAR_MS = 400;
const STAGGER_MS = 60;

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export interface ScoreRevealProps {
  score: number;
  pillars: Record<Pillar, number>;
  /** The band line for this score, already resolved from content_snippets. */
  line: string;
  breakdown: BreakdownItem[];
  closingLine: string | null;
  /** Animate the numeral and bars. False shows the final state at once. */
  animate?: boolean;
}

/**
 * The one orchestrated moment: a serif 72px numeral in brass settles over 600ms,
 * then four bars fill over 400ms staggered 60ms. Reduced motion shows the final state.
 */
export function ScoreReveal({ score, pillars, line, breakdown, closingLine, animate = true }: ScoreRevealProps) {
  const reduced = usePrefersReducedMotion();
  const shouldAnimate = animate && !reduced;
  const [displayed, setDisplayed] = useState(() => (animate ? 0 : score));
  const [filled, setFilled] = useState(!animate);
  const router = useRouter();
  const [draft, setDraft] = useState(closingLine ?? "");
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    if (!shouldAnimate) {
      frame = requestAnimationFrame(() => {
        setDisplayed(score);
        setFilled(true);
      });
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / NUMERAL_MS;
      setDisplayed(Math.round(easeOut(t) * score));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplayed(score);
        setFilled(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, shouldAnimate, score]);

  const onDone = () => {
    startSaving(async () => {
      setError(null);
      const trimmed = draft.trim();
      if (trimmed !== (closingLine ?? "")) {
        const result = await saveClosingLine(trimmed);
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      router.push("/today");
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center" aria-live="polite">
        <p className="sr-only">Today&apos;s Prime Score is {score} of 100.</p>
        <p aria-hidden className="font-display text-5xl text-brass tabular-nums">
          {displayed}
        </p>
        <p className="font-display mx-auto max-w-[28ch] text-lg text-ink">{line}</p>
      </div>

      <ul className="space-y-3">
        {PILLARS.map(({ key, label }, i) => {
          const points = pillars[key];
          const max = PILLAR_WEIGHTS[key];
          const pct = Math.round((points / max) * 100);
          return (
            <li key={key} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-ink">{label}</span>
                <span className="text-ink-soft tabular-nums">
                  {points} of {max}
                </span>
              </div>
              <div className="h-[6px] overflow-hidden rounded-full bg-hairline" aria-hidden>
                <div
                  className="h-full w-full origin-left rounded-full bg-harbour"
                  style={{
                    transform: `scaleX(${filled ? pct / 100 : 0})`,
                    transition: shouldAnimate ? `transform ${BAR_MS}ms ease-out ${i * STAGGER_MS}ms` : "none",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet>
        <SheetTrigger render={<Button variant="secondary" size="full" />}>Why this score</SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[16px] pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-hairline" aria-hidden />
          <SheetHeader>
            <SheetTitle className="font-sans text-lg font-semibold text-ink">Why this score</SheetTitle>
            <SheetDescription className="text-sm text-ink-soft">Every point, with its reason.</SheetDescription>
          </SheetHeader>
          <ul className="divide-y divide-hairline px-4 pb-4">
            {breakdown.map((item) => (
              <li key={item.key} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-base text-ink">{item.label}</p>
                  <p className="text-sm text-ink-soft">{item.reason}</p>
                </div>
                <p className="shrink-0 text-base text-ink tabular-nums">
                  {item.points} of {item.max}
                </p>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <div className="space-y-3">
        <Label htmlFor="closing-line" className="font-display text-lg font-normal text-ink">
          Today I became my Prime Self by
        </Label>
        <Input
          id="closing-line"
          name="closingLine"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="optional"
          maxLength={240}
          autoComplete="off"
          enterKeyHint="done"
          className="font-display text-lg"
        />
        {error ? (
          <p className="text-sm text-ember" role="alert">
            {error}
          </p>
        ) : null}
        <Button size="full" onClick={onDone} disabled={saving}>
          Done
        </Button>
      </div>
    </div>
  );
}
