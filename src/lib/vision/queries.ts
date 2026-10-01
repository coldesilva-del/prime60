import type { createClient } from "@/lib/supabase/server";
import { VISION_SECTIONS, type VisionSection } from "./schemas";

type Db = Awaited<ReturnType<typeof createClient>>;

export const VISION_BUCKET = "vision";
export const SIGNED_URL_SECONDS = 60 * 60;

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Could not load ${what}: ${error?.message ?? "unknown error"}`);
}

export type NorthStars = Record<VisionSection, string>;

export async function getNorthStars(db: Db, userId: string): Promise<NorthStars> {
  const { data, error } = await db.from("north_stars").select("section, body").eq("user_id", userId);
  if (error) fail("the North Star", error);
  const out = Object.fromEntries(VISION_SECTIONS.map((s) => [s, ""])) as NorthStars;
  for (const row of data) {
    if ((VISION_SECTIONS as readonly string[]).includes(row.section)) out[row.section as VisionSection] = row.body;
  }
  return out;
}

export interface VisionImage {
  section: VisionSection;
  storagePath: string;
  /** Signed, one hour. */
  url: string;
}

export type VisionImages = Partial<Record<VisionSection, VisionImage>>;

/** The user's uploaded images with signed URLs. The bucket is private. */
export async function getVisionImages(db: Db, userId: string): Promise<VisionImages> {
  const { data, error } = await db
    .from("vision_images")
    .select("section, storage_path")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) fail("vision images", error);

  const rows = data.filter((r) => (VISION_SECTIONS as readonly string[]).includes(r.section));
  if (!rows.length) return {};

  const { data: signed, error: signError } = await db.storage
    .from(VISION_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      SIGNED_URL_SECONDS,
    );
  if (signError || !signed) return {};

  const out: VisionImages = {};
  for (const row of rows) {
    const section = row.section as VisionSection;
    if (out[section]) continue; // newest wins
    const match = signed.find((s) => s.path === row.storage_path && !s.error);
    const url = match?.signedUrl;
    if (url) out[section] = { section, storagePath: row.storage_path, url };
  }
  return out;
}
