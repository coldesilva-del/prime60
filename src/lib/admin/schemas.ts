import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1, "Required.")
  .max(60)
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only.");
const text = z.string().trim().min(1, "Required.").max(2000);
const optionalText = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v));
const sortOrder = z.coerce.number().int().min(0).max(9999);
const active = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const pillarEnum = z.enum(["health", "identity", "relationships", "purpose"]);
export const scoreKeyEnum = z.enum(["h1", "h2", "i1", "i2", "r1", "r2", "p1", "p2", "p3"]);
export const sectionEnum = z.enum(["a", "b", "c", "d", "e", "f"]);

export const contentSchemas = {
  pattern_library: z.object({
    slug,
    name: text.pipe(z.string().max(80)),
    description: text,
    replacement: text,
    if_then: text,
    two_minute_start: optionalText,
    sort_order: sortOrder,
    is_active: active,
  }),
  courage_rep_types: z.object({
    slug,
    label: text.pipe(z.string().max(80)),
    sort_order: sortOrder,
    is_active: active,
  }),
  non_negotiable_catalogue: z.object({
    slug,
    label: text.pipe(z.string().max(80)),
    pillar: pillarEnum,
    score_key: scoreKeyEnum,
    sort_order: sortOrder,
    is_active: active,
  }),
  review_questions: z.object({
    section: sectionEnum,
    slug,
    prompt: text,
    sort_order: sortOrder,
    is_active: active,
  }),
  content_snippets: z.object({
    key: z
      .string()
      .trim()
      .min(1, "Required.")
      .max(80)
      .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only."),
    body: text.pipe(z.string().max(5000)),
  }),
} as const;

export const rowIdSchema = z.coerce.number().int().positive();
