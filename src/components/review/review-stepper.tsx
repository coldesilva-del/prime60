"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/forms/field";
import { Hairline } from "@/components/layout/section";
import { FigureList } from "@/components/review/figure-list";
import { PatternFocus } from "@/components/review/pattern-focus";
import { saveReviewSectionAction } from "@/lib/review/actions";
import type { PatternChoice } from "@/lib/review/queries";
import { REVIEW_SECTIONS, SECTION_TITLES, type ReviewAnswers, type ReviewSection } from "@/lib/review/schemas";
import type { ReviewSnapshot } from "@/lib/review/snapshot";

export interface ReviewQuestion {
  section: ReviewSection;
  slug: string;
  prompt: string;
}

interface ReviewStepperProps {
  weekStart: string;
  snapshot: ReviewSnapshot;
  questions: ReviewQuestion[];
  initialAnswers: ReviewAnswers;
  initialNextPriority: string | null;
  initialNextOneThing: string | null;
  completedAt: string | null;
  patterns: PatternChoice[];
  nonNegotiables: { id: number; label: string }[];
}

const PRIORITY_SLUG = "f_priority";
const ONE_THING_SLUG = "f_one_thing";

const SECTION_LEADS: Record<ReviewSection, string> = {
  a: "The body that carries the next five years.",
  b: "Evidence over intention.",
  c: "Who received the best of you.",
  d: "Votes for the man you are becoming.",
  e: "Make the next behaviour easier.",
  f: "One priority. One thing. Three non-negotiables.",
};

export function ReviewStepper(props: ReviewStepperProps) {
  const { weekStart, snapshot, questions, patterns, nonNegotiables } = props;

  const [answers, setAnswers] = useState<ReviewAnswers>(props.initialAnswers);
  const [nextPriority, setNextPriority] = useState(props.initialNextPriority ?? "");
  const [nextOneThing, setNextOneThing] = useState(props.initialNextOneThing ?? "");
  const [completed, setCompleted] = useState(props.completedAt !== null);
  const [step, setStep] = useState(() => firstOpenStep(questions, props.initialAnswers, props.completedAt));
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const finished = step >= REVIEW_SECTIONS.length;
  const section = finished ? null : REVIEW_SECTIONS[step];
  const sectionQuestions = section
    ? questions.filter((q) => q.section === section && q.slug !== PRIORITY_SLUG && q.slug !== ONE_THING_SLUG)
    : [];
  const priorityPrompt = questions.find((q) => q.slug === PRIORITY_SLUG)?.prompt ?? "Biggest priority next week";
  const oneThingPrompt = questions.find((q) => q.slug === ONE_THING_SLUG)?.prompt ?? "One thing that must be finished";

  function setAnswer(slug: string, value: string) {
    setAnswers((a) => ({ ...a, [slug]: value }));
  }

  function save(target: ReviewSection, advance: boolean) {
    const sectionAnswers: ReviewAnswers = {};
    for (const q of questions) if (q.section === target && answers[q.slug] !== undefined) sectionAnswers[q.slug] = answers[q.slug];
    const isLast = target === "f";
    setError(undefined);
    startTransition(async () => {
      const result = await saveReviewSectionAction({
        weekStart,
        section: target,
        answers: sectionAnswers,
        ...(isLast ? { nextPriority, nextOneThing, complete: true } : {}),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.fieldErrors) {
        setError(Object.values(result.fieldErrors)[0]);
        return;
      }
      if (isLast) setCompleted(true);
      if (advance) {
        setStep((s) => s + 1);
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
      }
    });
  }

  return (
    <div className="space-y-8">
      <StepIndicator step={step} onSelect={(i) => setStep(i)} />

      {section ? (
        <section key={section} className="space-y-6" aria-labelledby="review-section-title">
          <div className="space-y-1">
            <p className="text-sm text-ink-soft">
              Section {section.toUpperCase()} of F
            </p>
            <h2 id="review-section-title" className="font-display text-2xl text-ink">
              {SECTION_TITLES[section]}
            </h2>
            <p className="font-display text-lg text-ink-soft">{SECTION_LEADS[section]}</p>
          </div>

          {section === "a" ? <FigureList figures={snapshot.a} /> : null}
          {section === "b" ? <FigureList figures={snapshot.b} /> : null}
          {section === "c" ? <FigureList figures={snapshot.c} /> : null}
          {section === "d" ? <FigureList figures={snapshot.d} /> : null}
          {section === "e" ? (
            <div className="space-y-6">
              <FigureList figures={snapshot.e.figures} />
              {snapshot.e.mostFrequent ? (
                <div className="space-y-2 rounded-[16px] bg-harbour-soft/60 px-4 py-4">
                  <p className="text-sm font-medium text-ink-soft">The replacement for {snapshot.e.mostFrequent.name}</p>
                  <p className="text-base text-ink">{snapshot.e.mostFrequent.replacement}</p>
                  <p className="text-sm text-ink-soft">{snapshot.e.mostFrequent.ifThen}</p>
                </div>
              ) : null}
              <PatternFocus patterns={patterns} />
            </div>
          ) : null}

          {section === "f" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="next-priority">{priorityPrompt}</Label>
                <Input
                  id="next-priority"
                  value={nextPriority}
                  maxLength={200}
                  onChange={(e) => setNextPriority(e.target.value)}
                  placeholder="One line"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next-one-thing">{oneThingPrompt}</Label>
                <Input
                  id="next-one-thing"
                  value={nextOneThing}
                  maxLength={200}
                  onChange={(e) => setNextOneThing(e.target.value)}
                  placeholder="One line"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-medium text-ink-soft">Your three non-negotiables</h3>
                  <Link href="/more/non-negotiables" className="text-sm font-medium text-harbour">
                    Change
                  </Link>
                </div>
                {nonNegotiables.length ? (
                  <ul className="divide-y divide-hairline rounded-[16px] bg-surface">
                    {nonNegotiables.map((n) => (
                      <li key={n.id} className="px-4 py-3 text-base text-ink">
                        {n.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">No non-negotiables set yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {sectionQuestions.length ? (
            <div className="space-y-5">
              {sectionQuestions.map((q) => (
                <div key={q.slug} className="space-y-2">
                  <Label htmlFor={`q-${q.slug}`} className={cn("text-base font-normal", q.slug === "f_prime_self" && "font-display text-lg")}>
                    {q.prompt}
                  </Label>
                  <Textarea
                    id={`q-${q.slug}`}
                    value={answers[q.slug] ?? ""}
                    onChange={(e) => setAnswer(q.slug, e.target.value)}
                    className="min-h-24"
                    maxLength={4000}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <FormError message={error} />

          <div className="flex items-center gap-3">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={pending}>
                Back
              </Button>
            ) : null}
            <Button type="button" className="flex-1" onClick={() => save(section, true)} disabled={pending}>
              {section === "f" ? (completed ? "Save changes" : "Finish the review") : "Save and continue"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <Hairline />
          <div className="space-y-2">
            <h2 className="font-display text-2xl text-ink">Review complete.</h2>
            <p className="font-display text-lg text-ink-soft">
              {nextPriority ? `Next week: ${nextPriority}` : "Next week is set."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(0)}>
              Read it again
            </Button>
            <Button render={<Link href="/today" />}>Go to Today</Button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepIndicator({ step, onSelect }: { step: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Review sections">
      <ol className="flex gap-1.5">
        {REVIEW_SECTIONS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`Section ${s.toUpperCase()}, ${SECTION_TITLES[s]}`}
                className="flex h-11 w-full flex-col items-stretch justify-end gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={cn("text-center text-xs", state === "current" ? "text-ink" : "text-ink-faint")}>
                  {s.toUpperCase()}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-1 rounded-full",
                    state === "todo" ? "bg-hairline" : state === "done" ? "bg-harbour/50" : "bg-harbour",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function firstOpenStep(questions: ReviewQuestion[], answers: ReviewAnswers, completedAt: string | null): number {
  if (completedAt) return REVIEW_SECTIONS.length;
  for (let i = 0; i < REVIEW_SECTIONS.length; i++) {
    const s = REVIEW_SECTIONS[i];
    const qs = questions.filter((q) => q.section === s);
    const answered = qs.some((q) => (answers[q.slug] ?? "").trim().length > 0);
    if (!answered) return i;
  }
  return REVIEW_SECTIONS.length - 1;
}
