"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import { getSnippets } from "@/lib/content";
import { completeStuckSchema, startStuckSchema, type ActionState, type CompleteStuckInput, type StartStuckInput } from "./schemas";

const STUCK_PATHS = ["/today", "/progress"];

/** Creates the session row the moment the timer starts. */
export async function startStuckSessionAction(
  input: StartStuckInput,
): Promise<ActionState & { sessionId?: number; startedAt?: string; timerSeconds?: number }> {
  const parsed = startStuckSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("stuck_sessions")
    .insert({
      user_id: profile.user_id,
      started_at: startedAt,
      avoiding: parsed.data.avoiding,
      why: parsed.data.why,
      smallest_action: parsed.data.smallestAction,
      prime_self_would: parsed.data.primeSelfWould ?? null,
      timer_seconds: parsed.data.timerSeconds,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not start the session. Try again." };

  return { ok: true, sessionId: data.id, startedAt, timerSeconds: parsed.data.timerSeconds };
}

/**
 * Closes the session. Yes records a Courage Rep (source stuck) and links it.
 * Partly and No store the next or smaller action. Never shames.
 */
export async function completeStuckSessionAction(
  input: CompleteStuckInput,
): Promise<ActionState & { courageLine?: string }> {
  const parsed = completeStuckSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something went wrong. Try again." };

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("stuck_sessions")
    .select("id, courage_rep_id")
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!session) return { error: "That session could not be found." };

  let courageRepId = session.courage_rep_id;
  let courageLine: string | undefined;

  if (parsed.data.outcome === "yes" && !courageRepId) {
    const { data: rep, error } = await supabase
      .from("courage_reps")
      .insert({
        user_id: profile.user_id,
        occurred_on: todayIn(profile.timezone),
        custom_label: "Moved forward when stuck",
        source: "stuck",
      })
      .select("id")
      .single();
    if (error || !rep) return { error: "Could not record the Courage Rep. Try again." };
    courageRepId = rep.id;
  }
  if (parsed.data.outcome === "yes") {
    courageLine = (await getSnippets(["courage_line"])).courage_line;
  }

  const { error } = await supabase
    .from("stuck_sessions")
    .update({
      completed_at: new Date().toISOString(),
      outcome: parsed.data.outcome,
      next_action: parsed.data.nextAction ?? null,
      courage_rep_id: courageRepId,
    })
    .eq("user_id", profile.user_id)
    .eq("id", session.id);
  if (error) return { error: "Could not save. Try again." };

  for (const p of STUCK_PATHS) revalidatePath(p);
  return { ok: true, courageLine };
}
