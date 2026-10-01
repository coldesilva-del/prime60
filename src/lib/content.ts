import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin-editable copy from content_snippets, with hard fallbacks so the UI
 * never shows an empty string if a key is missing.
 */
const FALLBACKS: Record<string, string> = {
  score_line_90: "A Prime Self day.",
  score_line_70: "Solid. The man is being built.",
  score_line_50: "Mixed day. Return tomorrow.",
  score_line_0: "A reset day. One miss is an event. Return tomorrow.",
  miss_line: "One miss is an event. Two can become a pattern. Return today.",
  courage_line: "Courage Rep recorded. A vote for your Prime Self.",
  pattern_logged_line: "Logged. One appearance is information, not a verdict.",
  vision_quote: "I didn't waste it. I became the man I knew I could become.",
  vision_question: "Is today's behaviour worthy of that future?",
};

export const getSnippets = cache(async (keys: string[]): Promise<Record<string, string>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("content_snippets").select("key, body").in("key", keys);
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = FALLBACKS[k] ?? "";
  for (const row of data ?? []) out[row.key] = row.body;
  return out;
});

export const getSnippetsByPrefix = cache(async (prefix: string): Promise<Record<string, string>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("content_snippets").select("key, body").like("key", `${prefix}%`);
  const out: Record<string, string> = {};
  for (const row of data ?? []) out[row.key] = row.body;
  return out;
});
