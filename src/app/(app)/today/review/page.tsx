import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewStepper } from "@/components/review/review-stepper";
import { addDays, formatDayShort, todayIn, weekStart as mondayOf } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { recomputeSnapshotAction } from "@/lib/review/actions";
import {
  getActiveNonNegotiables,
  getPatternChoices,
  getReview,
  getReviewQuestions,
  loadSnapshotInputs,
} from "@/lib/review/queries";
import { answersFrom, type ReviewSection } from "@/lib/review/schemas";
import { computeSnapshot, isReviewSnapshot, WEEK_DAYS } from "@/lib/review/snapshot";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Weekly review" };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function WeeklyReviewPage(props: PageProps<"/today/review">) {
  const { week } = await props.searchParams;
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const currentWeek = mondayOf(today);

  // ?week=YYYY-MM-DD opens a past week. Any day in that week will do.
  let weekStart = currentWeek;
  if (typeof week === "string" && DAY.test(week)) {
    const requested = mondayOf(week);
    if (requested <= currentWeek) weekStart = requested;
  }
  const weekEnd = addDays(weekStart, WEEK_DAYS - 1);
  const weekLabel = `${formatDayShort(weekStart)} to ${formatDayShort(weekEnd)}`;

  const db = await createClient();
  const userId = profile.user_id;
  const [review, questions, patterns, nonNegotiables] = await Promise.all([
    getReview(db, userId, weekStart),
    getReviewQuestions(db),
    getPatternChoices(db, userId),
    getActiveNonNegotiables(db, userId),
  ]);

  const frozen = review !== null && isReviewSnapshot(review.snapshot);
  const snapshot = frozen && isReviewSnapshot(review.snapshot)
    ? review.snapshot
    : computeSnapshot(await loadSnapshotInputs(db, userId, weekStart));

  const previousWeek = addDays(weekStart, -WEEK_DAYS);
  const nextWeek = addDays(weekStart, WEEK_DAYS);

  async function recompute() {
    "use server";
    await recomputeSnapshotAction({ weekStart });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        display
        title="Weekly review"
        eyebrow={weekLabel}
        backHref="/today"
        description={
          weekStart === currentWeek
            ? "Ten to fifteen minutes. Every number here can be explained by tapping it. Partial progress saves."
            : "A past week. Edits save against that week."
        }
      />

      <nav aria-label="Review weeks" className="flex items-center justify-between text-sm">
        <Link href={`/today/review?week=${previousWeek}`} className="inline-flex h-11 items-center font-medium text-harbour">
          Previous week
        </Link>
        {weekStart < currentWeek ? (
          <Link href={`/today/review?week=${nextWeek}`} className="inline-flex h-11 items-center font-medium text-harbour">
            Next week
          </Link>
        ) : null}
      </nav>

      <ReviewStepper
        key={weekStart}
        weekStart={weekStart}
        snapshot={snapshot}
        questions={questions.map((q) => ({ section: q.section as ReviewSection, slug: q.slug, prompt: q.prompt }))}
        initialAnswers={answersFrom(review?.answers)}
        initialNextPriority={review?.next_priority ?? null}
        initialNextOneThing={review?.next_one_thing ?? null}
        completedAt={review?.completed_at ?? null}
        patterns={patterns}
        nonNegotiables={nonNegotiables.map((n) => ({ id: n.id, label: n.label }))}
      />

      {frozen ? (
        <form action={recompute} className="flex items-center justify-between gap-4 text-sm text-ink-soft">
          <span>Numbers were frozen when you first saved.</span>
          <button type="submit" className="inline-flex h-11 shrink-0 items-center font-medium text-harbour">
            Recompute
          </button>
        </form>
      ) : null}
    </div>
  );
}
