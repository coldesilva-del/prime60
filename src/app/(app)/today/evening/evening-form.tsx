"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { YesNo } from "@/components/ui/yes-no";
import { RatingRow } from "@/components/ui/rating-row";
import { Hairline } from "@/components/layout/section";
import { ScoreReveal } from "@/components/score/score-reveal";
import { saveEvening } from "@/lib/daily/actions";
import type { EveningValues, HealthMode } from "@/lib/daily/helpers";
import { scoreBand, type ScoreResult } from "@/lib/scoring/score";

interface EveningFormProps {
  initial: EveningValues;
  healthMode: HealthMode;
  oneThing: string | null;
  personName: string | null;
  projectName: string | null;
  patternLine: string;
  lines: Record<"90" | "70" | "50" | "0", string>;
  closingLine: string | null;
}

function PillarHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-ink-soft">{children}</h2>;
}

/** One scrolling screen grouped by pillar, every item a tap. Ends in the reveal. */
export function EveningForm({ initial, healthMode, oneThing, personName, projectName, patternLine, lines, closingLine }: EveningFormProps) {
  const [v, setV] = useState<EveningValues>(initial);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof EveningValues>(key: K) => (value: EveningValues[K]) => setV((prev) => ({ ...prev, [key]: value }));

  const reveal = () => {
    startTransition(async () => {
      setError(null);
      const res = await saveEvening(v);
      if (res.error || !res.result) {
        setError(res.error ?? "That did not save. Try again.");
        return;
      }
      setResult(res.result);
      window.scrollTo({ top: 0 });
    });
  };

  if (result) {
    return (
      <ScoreReveal
        score={result.score}
        pillars={result.pillars}
        line={lines[scoreBand(result.score)]}
        breakdown={result.breakdown}
        closingLine={closingLine}
        animate
      />
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        reveal();
      }}
    >
      <section className="space-y-4">
        <PillarHeading>Health</PillarHeading>
        <YesNo name="trained" label="Trained today?" value={v.trained} onChange={set("trained")} />
        {healthMode === "track" ? (
          <YesNo name="moved" label="Moved today?" value={v.moved} onChange={set("moved")} />
        ) : (
          <YesNo name="loggedWithCoach" label="Logged with your coach?" value={v.loggedWithCoach} onChange={set("loggedWithCoach")} />
        )}
        <RatingRow name="energy" label="Energy" value={v.energy} onChange={set("energy")} />
      </section>

      <Hairline />

      <section className="space-y-4">
        <PillarHeading>Identity</PillarHeading>
        <div className="space-y-2">
          <YesNo name="finishedOneThing" label="Finished the one thing?" value={v.finishedOneThing} onChange={set("finishedOneThing")} />
          {oneThing ? <p className="font-display text-lg text-ink-soft">{oneThing}</p> : null}
        </div>
        <YesNo name="courageRepToday" label="Courage Rep today?" value={v.courageRepToday} onChange={set("courageRepToday")} />
        <div className="flex items-center justify-between gap-4">
          <span className="text-base text-ink">Old patterns</span>
          <span className="flex items-center gap-3 text-sm text-ink-soft">
            {patternLine}
            <Link href="/today?log=pattern" className="inline-flex min-h-11 items-center text-harbour">
              Log one
            </Link>
          </span>
        </div>
      </section>

      <Hairline />

      <section className="space-y-4">
        <PillarHeading>Relationships</PillarHeading>
        <YesNo
          name="connected"
          label={`Connected with ${personName ?? "someone who matters"}?`}
          value={v.connected}
          onChange={set("connected")}
        />
        <YesNo name="qualityTime" label="Quality time, no phones?" value={v.qualityTime} onChange={set("qualityTime")} />
      </section>

      <Hairline />

      <section className="space-y-4">
        <PillarHeading>Purpose</PillarHeading>
        <YesNo name="published" label="Published something?" value={v.published} onChange={set("published")} />
        <YesNo
          name="movedProject"
          label={`Moved ${projectName ?? "your main project"} forward?`}
          value={v.movedProject}
          onChange={set("movedProject")}
        />
        <YesNo name="served" label="Served someone?" value={v.served} onChange={set("served")} />
      </section>

      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Reveal today's score"}
      </Button>
    </form>
  );
}
