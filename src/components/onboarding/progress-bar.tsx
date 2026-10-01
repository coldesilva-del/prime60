import { STEP_COUNT } from "@/lib/onboarding/steps";

/** Thin harbour bar with the step count beneath. */
export function OnboardingProgress({ step }: { step: number }) {
  const percent = Math.round((step / STEP_COUNT) * 100);
  return (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEP_COUNT}
        aria-valuenow={step}
        aria-label={`Step ${step} of ${STEP_COUNT}`}
        className="h-1 w-full overflow-hidden rounded-full bg-hairline"
      >
        <div
          className="h-full w-full origin-left rounded-full bg-harbour transition-transform duration-300"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
      <p className="text-xs text-ink-soft" aria-hidden>
        Step {step} of {STEP_COUNT}
      </p>
    </div>
  );
}
