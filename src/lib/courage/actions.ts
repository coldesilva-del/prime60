"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import { getSnippets } from "@/lib/content";
import type { CourageRepTypeRow } from "@/lib/supabase/types";
import { getCourageRepTypes } from "./queries";
import { courageRepSchema, type ActionState, type CourageRepInput } from "./schemas";

const COURAGE_PATHS = ["/today", "/progress"];

/** Everything the Courage Rep sheet needs, in one round trip. */
export async function loadCourageSheet(): Promise<{ types: CourageRepTypeRow[]; courageLine: string }> {
  await requireProfile();
  const [types, snippets] = await Promise.all([getCourageRepTypes(), getSnippets(["courage_line"])]);
  return { types, courageLine: snippets.courage_line };
}

/** One tap from the action sheet. Source is always manual here. */
export async function recordCourageRepAction(input: CourageRepInput): Promise<ActionState & { repId?: number }> {
  const parsed = courageRepSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pick a type or write a short label." };

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courage_reps")
    .insert({
      user_id: profile.user_id,
      occurred_on: todayIn(profile.timezone),
      type_id: parsed.data.typeId ?? null,
      custom_label: parsed.data.customLabel ?? null,
      note: parsed.data.note ?? null,
      source: "manual",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not record that. Try again." };

  for (const p of COURAGE_PATHS) revalidatePath(p);
  return { ok: true, repId: data.id };
}
