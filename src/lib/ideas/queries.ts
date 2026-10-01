import { createClient } from "@/lib/supabase/server";
import type { IdeaRow } from "@/lib/supabase/types";

export type IdeaLists = {
  /** Parked ideas due for review (review_on on or before today), oldest due first. */
  due: IdeaRow[];
  /** Parked ideas (decision null, park or review_30), newest first. */
  parked: IdeaRow[];
  killed: IdeaRow[];
  pursued: IdeaRow[];
};

export async function listIdeas(userId: string, today: string): Promise<IdeaLists> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false });
  if (error) throw new Error(`Could not load ideas: ${error.message}`);

  const lists: IdeaLists = { due: [], parked: [], killed: [], pursued: [] };
  for (const idea of data ?? []) {
    if (idea.decision === "kill") lists.killed.push(idea);
    else if (idea.decision === "pursue") lists.pursued.push(idea);
    else if (idea.review_on && idea.review_on <= today) lists.due.push(idea);
    else lists.parked.push(idea);
  }
  lists.due.sort((a, b) => (a.review_on ?? "").localeCompare(b.review_on ?? ""));
  return lists;
}

export async function getIdea(userId: string, id: number): Promise<IdeaRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the idea: ${error.message}`);
  return data;
}
