/**
 * Field definitions for the admin content editors. Shared by the server
 * action (validation) and the form (rendering). Keep in step with
 * supabase/migrations and src/lib/supabase/types.ts.
 */

export const CONTENT_TABLES = [
  "pattern_library",
  "courage_rep_types",
  "non_negotiable_catalogue",
  "review_questions",
  "content_snippets",
] as const;

export type ContentTable = (typeof CONTENT_TABLES)[number];

export type FieldKind = "text" | "textarea" | "number" | "boolean" | "select";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}

export interface TableDef {
  table: ContentTable;
  title: string;
  description: string;
  /** Column used as the row's display name in the list. */
  titleField: string;
  /** Optional second line in the list. */
  subtitleField?: string;
  orderBy: string;
  fields: FieldDef[];
}

const PILLAR_OPTIONS = [
  { value: "health", label: "Health" },
  { value: "identity", label: "Identity" },
  { value: "relationships", label: "Relationships" },
  { value: "purpose", label: "Purpose" },
];

const SCORE_KEY_OPTIONS = ["h1", "h2", "i1", "i2", "r1", "r2", "p1", "p2", "p3"].map((k) => ({ value: k, label: k }));

const SECTION_OPTIONS = ["a", "b", "c", "d", "e", "f"].map((s) => ({ value: s, label: `Section ${s}` }));

export const CONTENT_DEFS: Record<ContentTable, TableDef> = {
  pattern_library: {
    table: "pattern_library",
    title: "Pattern library",
    description: "Old patterns, their replacement behaviours and IF-THEN plans.",
    titleField: "name",
    subtitleField: "replacement",
    orderBy: "sort_order",
    fields: [
      { name: "slug", label: "Slug", kind: "text", required: true, hint: "Lowercase, underscores, unique." },
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
      { name: "replacement", label: "Replacement behaviour", kind: "textarea", required: true },
      { name: "if_then", label: "IF-THEN plan", kind: "textarea", required: true },
      { name: "two_minute_start", label: "Two minute start", kind: "textarea" },
      { name: "sort_order", label: "Sort order", kind: "number", required: true },
      { name: "is_active", label: "Active", kind: "boolean" },
    ],
  },
  courage_rep_types: {
    table: "courage_rep_types",
    title: "Courage Rep types",
    description: "The list offered when a man records a Courage Rep.",
    titleField: "label",
    subtitleField: "slug",
    orderBy: "sort_order",
    fields: [
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "label", label: "Label", kind: "text", required: true },
      { name: "sort_order", label: "Sort order", kind: "number", required: true },
      { name: "is_active", label: "Active", kind: "boolean" },
    ],
  },
  non_negotiable_catalogue: {
    table: "non_negotiable_catalogue",
    title: "Non-negotiable catalogue",
    description: "Standing commitments a user can pick, each tied to a pillar score item.",
    titleField: "label",
    subtitleField: "score_key",
    orderBy: "sort_order",
    fields: [
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "label", label: "Label", kind: "text", required: true },
      { name: "pillar", label: "Pillar", kind: "select", required: true, options: PILLAR_OPTIONS },
      { name: "score_key", label: "Score key", kind: "select", required: true, options: SCORE_KEY_OPTIONS },
      { name: "sort_order", label: "Sort order", kind: "number", required: true },
      { name: "is_active", label: "Active", kind: "boolean" },
    ],
  },
  review_questions: {
    table: "review_questions",
    title: "Review questions",
    description: "Weekly review prompts, grouped by section.",
    titleField: "prompt",
    subtitleField: "section",
    orderBy: "section",
    fields: [
      { name: "section", label: "Section", kind: "select", required: true, options: SECTION_OPTIONS },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "prompt", label: "Prompt", kind: "textarea", required: true },
      { name: "sort_order", label: "Sort order", kind: "number", required: true },
      { name: "is_active", label: "Active", kind: "boolean" },
    ],
  },
  content_snippets: {
    table: "content_snippets",
    title: "Content snippets",
    description: "Reveal lines, worked examples, identity examples and I'm Stuck labels, by key.",
    titleField: "key",
    subtitleField: "body",
    orderBy: "key",
    fields: [
      { name: "key", label: "Key", kind: "text", required: true, hint: "For example score_line_90 or identity_example_1." },
      { name: "body", label: "Body", kind: "textarea", required: true },
    ],
  },
};

export function isContentTable(value: string): value is ContentTable {
  return (CONTENT_TABLES as readonly string[]).includes(value);
}
