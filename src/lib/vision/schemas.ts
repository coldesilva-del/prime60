import { z } from "zod";

export const VISION_SECTIONS = ["health", "purpose", "relationships", "identity", "lifestyle", "moment"] as const;
export type VisionSection = (typeof VISION_SECTIONS)[number];

export const SECTION_LABELS: Record<VisionSection, string> = {
  health: "Health",
  purpose: "Purpose",
  relationships: "Relationships",
  identity: "Identity",
  lifestyle: "Lifestyle",
  moment: "Your Moment",
};

export const SECTION_HINTS: Record<VisionSection, string> = {
  health: "The body you live in at the target year. Present tense.",
  purpose: "The work, the standing, the way income arrives.",
  relationships: "Who is close, and what it feels like.",
  identity: "The man you are, in a sentence or three.",
  lifestyle: "Where you live, how you travel, what a good week holds.",
  moment: "One scene. Where you are sitting, what you can see, what is true.",
};

/** Sections shown on the Vision screen, in order. Identity is edited but not shown. */
export const VISION_DISPLAY_SECTIONS: VisionSection[] = ["health", "purpose", "relationships", "lifestyle"];

export const VISION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VISION_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const body = z.string().trim().max(4000, "Keep each section under 4000 characters.");

export const saveNorthStarsSchema = z.object({
  health: body,
  purpose: body,
  relationships: body,
  identity: body,
  lifestyle: body,
  moment: body,
});

export const recordVisionImageSchema = z.object({
  section: z.enum(VISION_SECTIONS),
  storagePath: z.string().min(1).max(300),
});

export const removeVisionImageSchema = z.object({ section: z.enum(VISION_SECTIONS) });

/** The only path an upload may land on: {user_id}/{section}.{ext}. */
export function visionImagePath(userId: string, section: VisionSection, ext: string): string {
  return `${userId}/${section}.${ext}`;
}

export function isOwnVisionPath(userId: string, section: VisionSection, path: string): boolean {
  const exts = Object.values(VISION_IMAGE_TYPES).join("|");
  return new RegExp(`^${userId}/${section}\\.(${exts})$`).test(path);
}
