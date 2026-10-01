import type { Metadata } from "next";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import { getSnippets } from "@/lib/content";
import { loadEvening } from "@/lib/daily/queries";
import { eveningPrefill, patternSummaryLine, toScoreInputs } from "@/lib/daily/helpers";
import { computeScore, scoreBand, type BreakdownItem } from "@/lib/scoring/score";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreReveal } from "@/components/score/score-reveal";
import { EveningForm } from "./evening-form";

export const metadata: Metadata = { title: "Close the day" };

const LINE_KEYS = ["score_line_90", "score_line_70", "score_line_50", "score_line_0"] as const;

export default async function EveningPage() {
  const profile = await requireProfile();
  const day = todayIn(profile.timezone);
  const [data, snippets] = await Promise.all([loadEvening(profile, day), getSnippets([...LINE_KEYS])]);
  const { entry } = data;
  const lines = {
    "90": snippets.score_line_90,
    "70": snippets.score_line_70,
    "50": snippets.score_line_50,
    "0": snippets.score_line_0,
  };

  const values = eveningPrefill(entry, data.commitments, data.courageRepsToday, profile.health_mode);

  if (entry.evening_done_at != null && entry.score != null) {
    // Persisted reveal state. Fall back to a recompute if the stored breakdown is missing.
    const stored = Array.isArray(entry.score_breakdown) ? (entry.score_breakdown as unknown as BreakdownItem[]) : null;
    const computed = stored ? null : computeScore(toScoreInputs(values, profile.health_mode, data.patterns));
    const breakdown = stored ?? computed!.breakdown;
    const pillars = {
      health: entry.score_health ?? computed?.pillars.health ?? 0,
      identity: entry.score_identity ?? computed?.pillars.identity ?? 0,
      relationships: entry.score_relationships ?? computed?.pillars.relationships ?? 0,
      purpose: entry.score_purpose ?? computed?.pillars.purpose ?? 0,
    };
    return (
      <div className="space-y-8">
        <PageHeader title="Today's score" backHref="/today" />
        <ScoreReveal
          score={entry.score}
          pillars={pillars}
          line={lines[scoreBand(entry.score)]}
          breakdown={breakdown}
          closingLine={entry.closing_line}
          animate={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Close the day" backHref="/today" />
      <EveningForm
        initial={values}
        healthMode={profile.health_mode}
        oneThing={entry.one_thing}
        personName={data.personName}
        projectName={data.projectName}
        patternLine={patternSummaryLine(data.patterns.followed, data.patterns.replaced)}
        lines={lines}
        closingLine={entry.closing_line}
      />
    </div>
  );
}
