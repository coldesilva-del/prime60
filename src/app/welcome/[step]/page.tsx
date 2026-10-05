import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { IdentityStep } from "@/components/onboarding/identity-step";
import { LifestyleStep } from "@/components/onboarding/lifestyle-step";
import { NonNegotiablesStep, type CustomNonNegotiable } from "@/components/onboarding/non-negotiables-step";
import { NorthStarStep } from "@/components/onboarding/north-star-step";
import { PatternsStep, type PatternOverride } from "@/components/onboarding/patterns-step";
import { PeopleStep, type PeopleGroupOption } from "@/components/onboarding/people-step";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { getSnippets } from "@/lib/content";
import {
  getActiveNonNegotiables,
  getActivePeople,
  getHealthTargets,
  getNonNegotiableCatalogue,
  getNorthStars,
  getPatternLibrary,
  getPeopleGroups,
  getPrimaryIdentityStatement,
  getUserPatterns,
} from "@/lib/onboarding/queries";
import {
  DEFAULT_NON_NEGOTIABLE_SLUGS,
  GROUP_DEFAULTS,
  NORTH_STAR_STEPS,
  STEP_TITLES,
  defaultTargetYear,
  exampleKeys,
  examplesFrom,
  parseStep,
  resumeStep,
  stepHref,
  type PersonDraft,
} from "@/lib/onboarding/steps";
import { requireProfile } from "@/lib/profile";
import type { GroupKey, ProfileRow } from "@/lib/supabase/types";

export async function generateMetadata({ params }: PageProps<"/welcome/[step]">): Promise<Metadata> {
  const { step } = await params;
  const current = parseStep(step);
  return { title: current ? STEP_TITLES[current] : "Welcome" };
}

export default async function WelcomeStepPage({ params }: PageProps<"/welcome/[step]">) {
  const { step } = await params;
  const current = parseStep(step);
  if (!current) notFound();

  const profile = await requireProfile();
  const allowed = resumeStep(profile.onboarding_step);
  if (current > allowed) redirect(stepHref(allowed));

  switch (current) {
    case 1:
      return (
        <WelcomeStep
          firstName={profile.first_name ?? ""}
          targetYear={profile.target_year ?? defaultTargetYear()}
          birthYear={profile.birth_year}
        />
      );
    case 2:
    case 3:
    case 4:
      return <NorthStar step={current} profile={profile} />;
    case 5:
      return <Lifestyle profile={profile} />;
    case 6:
      return <Patterns profile={profile} />;
    case 7:
      return <People profile={profile} />;
    case 8:
      return <NonNegotiables profile={profile} />;
    case 9:
      return <Identity profile={profile} />;
  }
}

async function NorthStar({ step, profile }: { step: 2 | 3 | 4; profile: ProfileRow }) {
  const { section, exampleKey } = NORTH_STAR_STEPS[step];
  const [stars, snippets] = await Promise.all([getNorthStars(profile.user_id, [section]), getSnippets(exampleKeys(exampleKey))]);
  return <NorthStarStep step={step} initialBody={stars[section] ?? ""} examples={examplesFrom(snippets, exampleKey)} />;
}

async function Lifestyle({ profile }: { profile: ProfileRow }) {
  const [stars, snippets] = await Promise.all([
    getNorthStars(profile.user_id, ["lifestyle", "moment"]),
    getSnippets([...exampleKeys("example_lifestyle"), ...exampleKeys("example_moment")]),
  ]);
  return (
    <LifestyleStep
      initialLifestyle={stars.lifestyle ?? ""}
      initialMoment={stars.moment ?? ""}
      lifestyleExamples={examplesFrom(snippets, "example_lifestyle")}
      momentExamples={examplesFrom(snippets, "example_moment")}
    />
  );
}

async function Patterns({ profile }: { profile: ProfileRow }) {
  const [library, mine] = await Promise.all([getPatternLibrary(), getUserPatterns(profile.user_id)]);
  const initialFocusIds = mine.filter((row) => row.in_focus).map((row) => row.pattern_id);
  const initialOverrides: Record<string, PatternOverride> = {};
  for (const row of mine) {
    if (row.replacement_override || row.if_then_override) {
      initialOverrides[String(row.pattern_id)] = {
        replacement: row.replacement_override ?? undefined,
        ifThen: row.if_then_override ?? undefined,
      };
    }
  }
  return <PatternsStep patterns={library} initialFocusIds={initialFocusIds} initialOverrides={initialOverrides} />;
}

async function People({ profile }: { profile: ProfileRow }) {
  const [groups, people] = await Promise.all([getPeopleGroups(profile.user_id), getActivePeople(profile.user_id)]);
  const keyById = new Map<number, GroupKey>(groups.map((g) => [g.id, g.key]));
  const options: PeopleGroupOption[] = GROUP_DEFAULTS.map((d) => {
    const existing = groups.find((g) => g.key === d.key);
    return { key: d.key, label: existing?.label ?? d.label, cadence: existing?.default_cadence_days ?? d.cadence };
  });
  const initialPeople: PersonDraft[] = [];
  for (const person of people) {
    const group = keyById.get(person.group_id);
    if (!group) continue;
    initialPeople.push({ id: person.id, group, name: person.name, cadenceDays: person.cadence_days });
  }
  return <PeopleStep groups={options} initialPeople={initialPeople} />;
}

async function NonNegotiables({ profile }: { profile: ProfileRow }) {
  const [catalogue, active] = await Promise.all([getNonNegotiableCatalogue(), getActiveNonNegotiables(profile.user_id)]);
  let initialCatalogueIds: number[];
  let initialCustom: CustomNonNegotiable | null = null;
  if (active.length > 0) {
    initialCatalogueIds = [];
    for (const row of active) {
      const match = catalogue.find((item) => item.label === row.label && item.score_key === row.score_key);
      if (match) initialCatalogueIds.push(match.id);
      else if (!initialCustom) initialCustom = { label: row.label, pillar: row.pillar };
    }
  } else {
    initialCatalogueIds = catalogue.filter((item) => DEFAULT_NON_NEGOTIABLE_SLUGS.includes(item.slug)).map((item) => item.id);
  }
  return <NonNegotiablesStep catalogue={catalogue} initialCatalogueIds={initialCatalogueIds} initialCustom={initialCustom} />;
}

async function Identity({ profile }: { profile: ProfileRow }) {
  const exampleKeys = ["identity_example_1", "identity_example_2", "identity_example_3", "identity_example_4"];
  const [statement, targets, snippets] = await Promise.all([
    getPrimaryIdentityStatement(profile.user_id),
    getHealthTargets(profile.user_id),
    getSnippets(exampleKeys),
  ]);
  const examples = exampleKeys.map((key) => snippets[key]).filter((body): body is string => Boolean(body));
  return (
    <IdentityStep
      initialStatement={statement ?? ""}
      examples={examples}
      initialHealthMode={profile.health_mode}
      targets={targets}
    />
  );
}
