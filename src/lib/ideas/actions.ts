"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { addDays, todayIn } from "@/lib/dates";
import type { Json } from "@/lib/supabase/types";
import {
  decideIdeaSchema,
  parkIdeaSchema,
  updateIdeaSchema,
  REVIEW_DAYS,
  type ActionState,
  type FilterAnswers,
  type IdeaDecision,
} from "./schemas";

function revalidateIdeas(id?: number) {
  revalidatePath("/plan");
  revalidatePath("/plan/ideas");
  revalidatePath("/plan/projects");
  if (id) revalidatePath(`/plan/ideas/${id}`);
}

/** One line and one tap from the action sheet. */
export async function parkIdeaAction(input: { title: string; note?: string | null }): Promise<ActionState & { ideaId?: number }> {
  const parsed = parkIdeaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Write one line." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .insert({ user_id: profile.user_id, title: parsed.data.title, note: parsed.data.note ?? null })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not park that. Try again." };

  revalidateIdeas();
  return { ok: true, ideaId: data.id };
}

export async function updateIdeaAction(input: { id: number; title: string; note?: string | null }): Promise<ActionState> {
  const parsed = updateIdeaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Write one line." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update({ title: parsed.data.title, note: parsed.data.note ?? null })
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.id);
  if (error) return { error: "Could not save. Try again." };

  revalidateIdeas(parsed.data.id);
  return { ok: true };
}

/**
 * Decide after the six filter questions. Pursue creates a project in idea
 * status and redirects to it with a prompt to activate, which may trigger the
 * active limit dialog there.
 */
export async function decideIdeaAction(input: {
  id: number;
  decision: IdeaDecision;
  answers?: FilterAnswers;
}): Promise<ActionState> {
  const parsed = decideIdeaSchema.safeParse(input);
  if (!parsed.success) return { error: "Something went wrong. Try again." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const today = todayIn(profile.timezone);

  const { data: idea } = await supabase
    .from("ideas")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!idea) return { error: "That idea could not be found." };

  const answers = (parsed.data.answers ?? null) as Json | null;
  const decidedAt = new Date().toISOString();
  const { decision } = parsed.data;

  if (decision !== "pursue") {
    const { error } = await supabase
      .from("ideas")
      .update({
        decision,
        decided_at: decidedAt,
        review_on: decision === "review_30" ? addDays(today, REVIEW_DAYS) : null,
        filter_answers: answers,
      })
      .eq("user_id", profile.user_id)
      .eq("id", idea.id);
    if (error) return { error: "Could not save the decision. Try again." };
    revalidateIdeas(idea.id);
    return { ok: true };
  }

  // Pursue: reuse a linked project if one exists, otherwise create one as an idea.
  let projectId = idea.project_id;
  if (!projectId) {
    const pillar = parsed.data.answers?.pillar ?? "purpose";
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: profile.user_id,
        name: idea.title,
        pillar,
        notes: idea.note,
        status: "idea",
        idea_id: idea.id,
      })
      .select("id")
      .single();
    if (error || !project) return { error: "Could not create the project. Try again." };
    projectId = project.id;
    await supabase.from("project_status_history").insert({
      user_id: profile.user_id,
      project_id: projectId,
      from_status: null,
      to_status: "idea",
      note: `from idea ${idea.id}`,
    });
  }

  const { error } = await supabase
    .from("ideas")
    .update({ decision: "pursue", decided_at: decidedAt, review_on: null, filter_answers: answers, project_id: projectId })
    .eq("user_id", profile.user_id)
    .eq("id", idea.id);
  if (error) return { error: "Could not save the decision. Try again." };

  revalidateIdeas(idea.id);
  revalidatePath(`/plan/projects/${projectId}`);
  redirect(`/plan/projects/${projectId}?activate=1`);
}
