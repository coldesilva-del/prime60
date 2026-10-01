"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, type ActionState } from "@/lib/auth/schemas";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { VISION_BUCKET } from "./queries";
import {
  isOwnVisionPath,
  recordVisionImageSchema,
  removeVisionImageSchema,
  saveNorthStarsSchema,
  VISION_SECTIONS,
} from "./schemas";

const VISION_PATHS = ["/vision", "/vision/edit", "/plan/roadmap", "/today"];

function revalidateVision() {
  for (const p of VISION_PATHS) revalidatePath(p);
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/** Saves all six North Star sections at once. Empty sections are stored as empty text. */
export async function saveNorthStarsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = saveNorthStarsSchema.safeParse(
    Object.fromEntries(VISION_SECTIONS.map((s) => [s, str(formData, s)])),
  );
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const profile = await requireProfile();
  const db = await createClient();

  const { error } = await db.from("north_stars").upsert(
    VISION_SECTIONS.map((section) => ({ user_id: profile.user_id, section, body: parsed.data[section] })),
    { onConflict: "user_id,section" },
  );
  if (error) return { error: "Could not save your vision. Try again." };

  revalidateVision();
  redirect("/vision");
}

/**
 * Records an image the browser has already uploaded to the private bucket at
 * {user_id}/{section}.{ext}. Replaces any earlier image for the section.
 */
export async function recordVisionImageAction(input: unknown): Promise<ActionState> {
  const parsed = recordVisionImageSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { section, storagePath } = parsed.data;

  const profile = await requireProfile();
  if (!isOwnVisionPath(profile.user_id, section, storagePath)) {
    return { error: "That image path is not allowed." };
  }
  const db = await createClient();

  const { data: existing, error: loadError } = await db
    .from("vision_images")
    .select("id, storage_path")
    .eq("user_id", profile.user_id)
    .eq("section", section);
  if (loadError) return { error: "Could not record the image. Try again." };

  const stalePaths = existing.map((r) => r.storage_path).filter((p) => p !== storagePath);
  if (stalePaths.length) await db.storage.from(VISION_BUCKET).remove(stalePaths);
  if (existing.length) {
    await db
      .from("vision_images")
      .delete()
      .eq("user_id", profile.user_id)
      .in(
        "id",
        existing.map((r) => r.id),
      );
  }

  const { error } = await db
    .from("vision_images")
    .insert({ user_id: profile.user_id, section, storage_path: storagePath });
  if (error) return { error: "Could not record the image. Try again." };

  revalidateVision();
  return { ok: true };
}

export async function removeVisionImageAction(input: unknown): Promise<ActionState> {
  const parsed = removeVisionImageSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { section } = parsed.data;

  const profile = await requireProfile();
  const db = await createClient();

  const { data: existing, error: loadError } = await db
    .from("vision_images")
    .select("id, storage_path")
    .eq("user_id", profile.user_id)
    .eq("section", section);
  if (loadError) return { error: "Could not remove the image. Try again." };
  if (!existing.length) return { ok: true };

  await db.storage.from(VISION_BUCKET).remove(existing.map((r) => r.storage_path));
  const { error } = await db
    .from("vision_images")
    .delete()
    .eq("user_id", profile.user_id)
    .in(
      "id",
      existing.map((r) => r.id),
    );
  if (error) return { error: "Could not remove the image. Try again." };

  revalidateVision();
  return { ok: true };
}
