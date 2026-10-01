/**
 * Wall-clock timer state for I'm Stuck. Remaining time is derived from
 * Date.now() so locking the phone or backgrounding the tab never pauses it.
 * Pauses are accumulated explicitly.
 */

export interface TimerState {
  /** Epoch ms when the timer (re)started. */
  startedAtMs: number;
  /** Length of this run in seconds. */
  timerSeconds: number;
  /** Total ms spent paused before the current pause, if any. */
  pausedAccumulatedMs: number;
  /** Epoch ms when the current pause began, or null when running. */
  pausedAtMs: number | null;
}

export function createTimer(timerSeconds: number, nowMs: number): TimerState {
  return { startedAtMs: nowMs, timerSeconds, pausedAccumulatedMs: 0, pausedAtMs: null };
}

/** Milliseconds elapsed while running (pauses excluded). */
export function elapsedMs(state: TimerState, nowMs: number): number {
  const pausedNow = state.pausedAtMs !== null ? Math.max(0, nowMs - state.pausedAtMs) : 0;
  const raw = nowMs - state.startedAtMs - state.pausedAccumulatedMs - pausedNow;
  return Math.max(0, raw);
}

/** Whole seconds remaining, never below zero. Rounds up so 14:59.2 shows 15:00 until a full second passes. */
export function remainingSeconds(state: TimerState, nowMs: number): number {
  const remainingMs = state.timerSeconds * 1000 - elapsedMs(state, nowMs);
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isFinished(state: TimerState, nowMs: number): boolean {
  return remainingSeconds(state, nowMs) === 0;
}

export function pauseTimer(state: TimerState, nowMs: number): TimerState {
  if (state.pausedAtMs !== null) return state;
  return { ...state, pausedAtMs: nowMs };
}

export function resumeTimer(state: TimerState, nowMs: number): TimerState {
  if (state.pausedAtMs === null) return state;
  return {
    ...state,
    pausedAccumulatedMs: state.pausedAccumulatedMs + Math.max(0, nowMs - state.pausedAtMs),
    pausedAtMs: null,
  };
}

/** mm:ss, minutes not padded beyond two digits (15:00, 02:00, 00:09). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function isTimerState(value: unknown): value is TimerState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.startedAtMs === "number" &&
    typeof v.timerSeconds === "number" &&
    typeof v.pausedAccumulatedMs === "number" &&
    (v.pausedAtMs === null || typeof v.pausedAtMs === "number")
  );
}
