"use client";

import { useState } from "react";
import { RatingRow } from "@/components/ui/rating-row";
import { ButtonLink } from "@/components/ui/button";

type PillarKey = "health" | "purpose" | "relationships" | "identity";

const PILLARS: { key: PillarKey; label: string; question: string }[] = [
  { key: "health", label: "Health", question: "Energy, waist, sleep, strength. How is your body, honestly?" },
  { key: "purpose", label: "Purpose", question: "Work that matters and money that does not keep you awake." },
  { key: "relationships", label: "Relationships", question: "Partner, children, family, mates. Did they get the best of you this year?" },
  { key: "identity", label: "Identity", question: "Do you finish what you start and act despite fear?" },
];

const READINGS: Record<PillarKey, string> = {
  health:
    "Your body is carrying the cost of the other three. The good news: health responds fastest to small daily promises. Three a day, kept, is where Prime 60 starts you.",
  purpose:
    "The work is not giving back what it takes. Prime 60 asks for one thing to finish each day and tracks whether you actually finish, which is where self-trust and direction come from.",
  relationships:
    "The people who matter are getting what is left over. Prime 60 asks you each morning who you will invest in, and gives you a quiet note when someone has gone too long without hearing from you.",
  identity:
    "You know what to do and keep not doing it. That is not weakness; it is an old pattern without a replacement. Prime 60 logs the pattern when it shows up and hands you the better response.",
};

export function Scorecard({ claimLabel, placesLeft }: { claimLabel: string; placesLeft: number | null }) {
  const [scores, setScores] = useState<Record<PillarKey, number | null>>({
    health: null,
    purpose: null,
    relationships: null,
    identity: null,
  });
  const done = PILLARS.every((p) => scores[p.key] !== null);

  let lowest: PillarKey | null = null;
  let highest: PillarKey | null = null;
  if (done) {
    const sorted = [...PILLARS].sort((a, b) => (scores[a.key] ?? 0) - (scores[b.key] ?? 0));
    lowest = sorted[0].key;
    highest = sorted[sorted.length - 1].key;
  }
  const total = done ? PILLARS.reduce((sum, p) => sum + (scores[p.key] ?? 0), 0) : null;
  const gap = done && lowest && highest ? (scores[highest] ?? 0) - (scores[lowest] ?? 0) : 0;

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {PILLARS.map((p) => (
          <div key={p.key} className="space-y-2">
            <p className="text-sm text-ink-soft">{p.question}</p>
            <RatingRow
              name={p.key}
              label={p.label}
              value={scores[p.key]}
              onChange={(v) => setScores((s) => ({ ...s, [p.key]: v }))}
            />
          </div>
        ))}
      </div>

      {done && lowest && highest ? (
        <section aria-live="polite" className="space-y-4 rounded-[16px] bg-surface px-4 py-5">
          <p className="text-sm text-ink-soft">Your scorecard</p>
          <p className="font-display text-3xl text-ink">
            {total} out of 40
          </p>
          <p className="measure text-base text-ink">
            {gap >= 3
              ? `${PILLARS.find((p) => p.key === highest)?.label} is carrying the others. ${PILLARS.find((p) => p.key === lowest)?.label} scored ${gap} points lower. That gap is what the next five years will be about.`
              : `Your four pillars are close together. The question is whether they are all moving up, and whether anything is measuring that.`}
          </p>
          <p className="measure text-base text-ink-soft">{READINGS[lowest]}</p>
          <div className="space-y-2 pt-2">
            <ButtonLink href="/sign-up" size="full">
              {claimLabel}
            </ButtonLink>
            <p className="text-sm text-ink-soft">
              {placesLeft !== null && placesLeft > 0
                ? `${placesLeft} founding places left. Free for life, no card.`
                : "Free to start. No card."}
            </p>
          </div>
        </section>
      ) : (
        <p className="text-sm text-ink-soft">Rate all four to see your scorecard. Nothing is saved or sent.</p>
      )}
    </div>
  );
}
