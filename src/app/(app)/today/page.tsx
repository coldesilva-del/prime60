import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import { dayOfWeekIn, formatDayLong, greetingFor, hourIn, todayIn } from "@/lib/dates";
import { loadToday } from "@/lib/daily/queries";
import { pickPrompt, PROMPTS } from "@/lib/daily/helpers";
import { PromptBanner } from "@/components/layout/prompt-banner";
import { Group } from "@/components/layout/section";
import { TrajectoryBlock } from "@/components/score/trajectory-block";
import { CommitmentRow } from "@/components/today/commitment-row";
import { OneThing } from "@/components/today/one-thing";
import { IntentRows } from "@/components/today/intent-rows";
import { HabitStacks } from "@/components/today/habit-stacks";
import { StuckButton } from "@/components/today/stuck-button";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const profile = await requireProfile();
  const tz = profile.timezone;
  const day = todayIn(tz);
  const data = await loadToday(profile, day);
  const { entry } = data;

  const prompt = pickPrompt({
    morningDone: entry.morning_done_at != null,
    eveningDone: entry.evening_done_at != null,
    hour: hourIn(tz),
    eveningHour: profile.evening_hour,
    dayOfWeek: dayOfWeekIn(tz),
    reviewCompleted: data.reviewCompleted,
    weighInDow: profile.weigh_in_dow,
    weightLoggedToday: data.weightLoggedToday,
  });

  const courageLabel = entry.courage_intent_type_id
    ? (data.courageRepTypes.find((t) => t.id === entry.courage_intent_type_id)?.label ?? null)
    : null;
  const personName = entry.person_id ? (data.people.find((p) => p.id === entry.person_id)?.name ?? null) : null;

  return (
    <div className="space-y-5 pb-16">
      <header>
        <p className="text-sm text-ink-soft">{formatDayLong(day)}</p>
        <h1 className="font-display text-xl text-ink">
          {greetingFor(hourIn(tz))}
          {profile.first_name ? `, ${profile.first_name}` : ""}.
        </h1>
      </header>

      {prompt ? <PromptBanner {...PROMPTS[prompt]} /> : null}

      <TrajectoryBlock trajectory={data.trajectory} />

      <section aria-label="Today's non-negotiables">
        {data.commitments.length > 0 ? (
          <Group>
            {data.commitments.map((c) => (
              <CommitmentRow key={c.id} id={c.id} label={c.label} completed={c.completed} />
            ))}
          </Group>
        ) : (
          <Group>
            <Link href="/more/non-negotiables" className="flex h-14 items-center px-4 text-base text-harbour">
              Choose your three non-negotiables
            </Link>
          </Group>
        )}
      </section>

      <OneThing text={entry.one_thing} finished={entry.finished_one_thing === true} />

      <IntentRows
        courageLabel={courageLabel}
        courageDone={data.courageRepsToday > 0}
        personName={personName}
        connected={entry.connected === true}
      />

      <HabitStacks stacks={data.habitStacks} />

      {entry.evening_done_at != null && entry.score != null ? (
        <Link
          href="/today/evening"
          className="inline-flex min-h-11 items-center text-sm text-ink-soft hover:text-ink"
        >
          Today: {entry.score}
        </Link>
      ) : null}

      <StuckButton />
    </div>
  );
}
