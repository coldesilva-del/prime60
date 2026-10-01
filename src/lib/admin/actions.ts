"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import type { Inserts } from "@/lib/supabase/types";
import { CONTENT_DEFS, isContentTable, type ContentTable } from "./content-config";
import { contentSchemas, rowIdSchema } from "./schemas";

async function requireAdmin() {
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/more");
  return profile;
}

/** Paths that read content tables and must refresh after an edit. */
const CONTENT_PATHS = ["/more/admin/content", "/today", "/more/patterns", "/more/non-negotiables", "/today/review", "/vision"];

function revalidateContent(table: ContentTable) {
  revalidatePath(`/more/admin/content/${table}`);
  for (const p of CONTENT_PATHS) revalidatePath(p);
}

function formValues(table: ContentTable, formData: FormData): Record<string, FormDataEntryValue | undefined> {
  const out: Record<string, FormDataEntryValue | undefined> = {};
  for (const f of CONTENT_DEFS[table].fields) {
    const v = formData.get(f.name);
    out[f.name] = f.kind === "boolean" ? (v ?? "false") : (v ?? undefined);
  }
  return out;
}

async function writeRow(table: ContentTable, id: number | null, values: Record<string, unknown>) {
  const supabase = await createClient();
  // The builder is picked per table so the row type matches the schema output.
  switch (table) {
    case "pattern_library": {
      const v = values as Inserts<"pattern_library">;
      return id ? supabase.from(table).update(v).eq("id", id) : supabase.from(table).insert(v);
    }
    case "courage_rep_types": {
      const v = values as Inserts<"courage_rep_types">;
      return id ? supabase.from(table).update(v).eq("id", id) : supabase.from(table).insert(v);
    }
    case "non_negotiable_catalogue": {
      const v = values as Inserts<"non_negotiable_catalogue">;
      return id ? supabase.from(table).update(v).eq("id", id) : supabase.from(table).insert(v);
    }
    case "review_questions": {
      const v = values as Inserts<"review_questions">;
      return id ? supabase.from(table).update(v).eq("id", id) : supabase.from(table).insert(v);
    }
    case "content_snippets": {
      const v = values as Inserts<"content_snippets">;
      return id ? supabase.from(table).update(v).eq("id", id) : supabase.from(table).insert(v);
    }
  }
}

/** Creates (id empty) or updates a content row. Redirects to the list on success. */
export async function saveContentRowAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const table = String(formData.get("table") ?? "");
  if (!isContentTable(table)) return { error: "Unknown content table." };

  const rawId = formData.get("id");
  let id: number | null = null;
  if (rawId && String(rawId) !== "") {
    const parsedId = rowIdSchema.safeParse(rawId);
    if (!parsedId.success) return { error: "Could not find that row." };
    id = parsedId.data;
  }

  const parsed = contentSchemas[table].safeParse(formValues(table, formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { error } = await writeRow(table, id, parsed.data);
  if (error) {
    if (error.code === "23505") return { error: "That slug or key is already in use." };
    return { error: "Could not save. Try again." };
  }

  revalidateContent(table);
  redirect(`/more/admin/content/${table}`);
}

export async function deleteContentRowAction(table: string, id: number): Promise<ActionState> {
  await requireAdmin();
  if (!isContentTable(table)) return { error: "Unknown content table." };
  const parsedId = rowIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Could not find that row." };

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", parsedId.data);
  if (error) {
    if (error.code === "23503") return { error: "That row is referenced by user data. Mark it inactive instead." };
    return { error: "Could not delete. Try again." };
  }

  revalidateContent(table);
  redirect(`/more/admin/content/${table}`);
}
