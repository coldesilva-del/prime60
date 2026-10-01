"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { completeStuckSessionAction, startStuckSessionAction } from "@/lib/stuck/actions";
import { DEFAULT_TIMER_SECONDS, SHORT_TIMER_SECONDS } from "@/lib/stuck/schemas";
import {
  createTimer,
  formatClock,
  isFinished,
  isTimerState,
  pauseTimer,
  remainingSeconds,
  resumeTimer,
  type TimerState,
} from "@/lib/stuck/timer";
import type { StuckWhy } from "@/lib/supabase/types";

const STORAGE_KEY = "prime60-stuck";

type Step = "form" | "timer" | "outcome" | "partly" | "no" | "done";

interface Stored {
  sessionId: number;
  action: string;
  timer: TimerState;
}

interface StuckFlowProps {
  whyOptions: { key: StuckWhy; label: string }[];
}

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: Stored | null) {
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the timer still runs from memory.
  }
}

function parseStored(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Stored>;
    if (typeof v.sessionId === "number" && typeof v.action === "string" && isTimerState(v.timer)) {
      return { sessionId: v.sessionId, action: v.action, timer: v.timer };
    }
  } catch {
    // fall through
  }
  return null;
}

const noopSubscribe = () => () => {};

const chipClass =
  "inline-flex min-h-11 items-center rounded-[999px] border px-4 text-[15px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** I'm Stuck: four quick questions, a 15 minute timer, one honest answer. */
export function StuckFlow({ whyOptions }: StuckFlowProps) {
  const router = useRouter();

  // Resume a session after a reload (for example the PWA relaunching after the phone was locked).
  const storedRaw = useSyncExternalStore(noopSubscribe, readStored, () => null);
  const [adopted, setAdopted] = useState(false);

  const [step, setStep] = useState<Step>("form");
  const [avoiding, setAvoiding] = useState("");
  const [why, setWhy] = useState<StuckWhy | null>(null);
  const [smallest, setSmallest] = useState("");
  const [primeSelf, setPrimeSelf] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [action, setAction] = useState("");
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [nextAction, setNextAction] = useState("");
  const [courageLine, setCourageLine] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!adopted && storedRaw !== null) {
    setAdopted(true);
    const stored = parseStored(storedRaw);
    if (stored && step === "form") {
      setSessionId(stored.sessionId);
      setAction(stored.action);
      setTimer(stored.timer);
      setStep("timer");
    }
  }

  // Wall-clock tick. Locking the phone does not pause the timer; the next tick catches up.
  useEffect(() => {
    if (step !== "timer" || !timer) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (isFinished(timer, t)) setStep("outcome");
    };
    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [step, timer]);

  function persist(next: { sessionId: number; action: string; timer: TimerState } | null) {
    writeStored(next);
  }

  function start() {
    if (!why) {
      setFieldErrors({ why: "Pick the closest reason." });
      return;
    }
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await startStuckSessionAction({
        avoiding,
        why,
        smallestAction: smallest,
        primeSelfWould: primeSelf,
        timerSeconds: DEFAULT_TIMER_SECONDS,
      });
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
        return;
      }
      if (res.error || !res.sessionId) {
        setError(res.error ?? "Could not start. Try again.");
        return;
      }
      const t = createTimer(res.timerSeconds ?? DEFAULT_TIMER_SECONDS, Date.now());
      setSessionId(res.sessionId);
      setAction(smallest.trim());
      setTimer(t);
      setNow(Date.now());
      setStep("timer");
      persist({ sessionId: res.sessionId, action: smallest.trim(), timer: t });
    });
  }

  function togglePause() {
    if (!timer || sessionId === null) return;
    const t = Date.now();
    const next = timer.pausedAtMs === null ? pauseTimer(timer, t) : resumeTimer(timer, t);
    setTimer(next);
    setNow(t);
    persist({ sessionId, action, timer: next });
  }

  function finishEarly() {
    setStep("outcome");
  }

  function complete(outcome: "yes" | "partly" | "no", after: "done" | "restart") {
    if (sessionId === null) return;
    setError(null);
    startTransition(async () => {
      const res = await completeStuckSessionAction({
        id: sessionId,
        outcome,
        nextAction: outcome === "yes" ? null : nextAction,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (after === "restart") {
        const t = createTimer(SHORT_TIMER_SECONDS, Date.now());
        const smaller = nextAction.trim() || action;
        setAction(smaller);
        setTimer(t);
        setNow(Date.now());
        setNextAction("");
        setStep("timer");
        persist({ sessionId, action: smaller, timer: t });
        return;
      }
      persist(null);
      if (outcome === "yes") {
        setCourageLine(res.courageLine ?? "Courage Rep recorded. A vote for your Prime Self.");
        setStep("done");
        return;
      }
      router.push("/today");
    });
  }

  if (step === "timer" && timer) {
    const remaining = remainingSeconds(timer, now);
    const paused = timer.pausedAtMs !== null;
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-8 text-center">
        <p
          className="font-display text-5xl text-ink tabular-nums"
          aria-live="off"
          aria-label={`${formatClock(remaining)} remaining`}
        >
          {formatClock(remaining)}
        </p>
        <p className="measure text-lg text-ink">{action}</p>
        {paused ? (
          <p className="text-sm text-ink-soft" role="status">
            Paused
          </p>
        ) : null}
        <div className="grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={togglePause}>
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button variant="outline" size="lg" onClick={finishEarly}>
            Done early
          </Button>
        </div>
      </div>
    );
  }

  if (step === "outcome") {
    return (
      <div className="space-y-6">
        <PageHeader title="Did you move forward?" />
        <p className="measure text-base text-ink-soft">{action}</p>
        {error ? (
          <p className="text-sm text-ember" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-3 gap-3">
          <Button size="lg" disabled={pending} onClick={() => complete("yes", "done")}>
            Yes
          </Button>
          <Button variant="secondary" size="lg" disabled={pending} onClick={() => setStep("partly")}>
            Partly
          </Button>
          <Button variant="secondary" size="lg" disabled={pending} onClick={() => setStep("no")}>
            No
          </Button>
        </div>
      </div>
    );
  }

  if (step === "partly") {
    return (
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          complete("partly", "done");
        }}
      >
        <PageHeader title="Good. What is the next action?" />
        <div className="space-y-1.5">
          <Label htmlFor="next-action">Next action</Label>
          <Input
            id="next-action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            maxLength={300}
            autoFocus
            autoComplete="off"
          />
        </div>
        {error ? (
          <p className="text-sm text-ember" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="full" disabled={pending}>
          Done
        </Button>
      </form>
    );
  }

  if (step === "no") {
    return (
      <div className="space-y-6">
        <PageHeader title="Make it smaller." description="What is one step so small it is hard to say no to?" />
        <div className="space-y-1.5">
          <Label htmlFor="smaller-action">Smaller action</Label>
          <Input
            id="smaller-action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            maxLength={300}
            autoFocus
            autoComplete="off"
          />
        </div>
        {error ? (
          <p className="text-sm text-ember" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" disabled={pending} onClick={() => complete("no", "done")}>
            Done
          </Button>
          <Button size="lg" disabled={pending || !nextAction.trim()} onClick={() => complete("no", "restart")}>
            Start for 2 minutes
          </Button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="space-y-6">
        <p className="font-display text-xl text-ink">{courageLine}</p>
        <Link
          href="/today"
          className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-primary px-5 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Done
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
      noValidate
    >
      <PageHeader title="Stuck?" backHref="/today" description="Four quick answers, then fifteen minutes." />

      <div className="space-y-1.5">
        <Label htmlFor="avoiding">What are you avoiding?</Label>
        <Input
          id="avoiding"
          value={avoiding}
          onChange={(e) => setAvoiding(e.target.value)}
          maxLength={300}
          autoComplete="off"
          aria-invalid={fieldErrors.avoiding ? true : undefined}
        />
        {fieldErrors.avoiding ? (
          <p className="text-sm text-ember" role="alert">
            {fieldErrors.avoiding}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="block text-sm font-medium text-ink">Why?</legend>
        <div role="radiogroup" aria-label="Why" className="flex flex-wrap gap-2">
          {whyOptions.map((o) => {
            const selected = why === o.key;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setWhy(o.key)}
                className={cn(
                  chipClass,
                  selected
                    ? "border-harbour bg-harbour text-primary-foreground"
                    : "border-hairline bg-surface text-ink hover:bg-surface-raised",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {fieldErrors.why ? (
          <p className="text-sm text-ember" role="alert">
            {fieldErrors.why}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="smallest">Smallest meaningful action</Label>
        <Input
          id="smallest"
          value={smallest}
          onChange={(e) => setSmallest(e.target.value)}
          maxLength={300}
          autoComplete="off"
          aria-invalid={fieldErrors.smallestAction ? true : undefined}
        />
        {fieldErrors.smallestAction ? (
          <p className="text-sm text-ember" role="alert">
            {fieldErrors.smallestAction}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prime-self">What would your Prime Self do? (optional)</Label>
        <Input
          id="prime-self"
          value={primeSelf}
          onChange={(e) => setPrimeSelf(e.target.value)}
          maxLength={500}
          autoComplete="off"
        />
      </div>

      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Starting" : "Do it for 15 minutes"}
      </Button>
    </form>
  );
}
