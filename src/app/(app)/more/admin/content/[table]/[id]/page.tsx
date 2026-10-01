import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/layout/section";
import { ContentRowForm } from "@/components/settings/content-row-form";
import { CONTENT_DEFS, isContentTable } from "@/lib/admin/content-config";
import { getContentRow } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit content" };

export default async function AdminContentRowPage({ params }: PageProps<"/more/admin/content/[table]/[id]">) {
  const { table, id } = await params;
  if (!isContentTable(table)) notFound();
  const def = CONTENT_DEFS[table];

  const isNew = id === "new";
  const rowId = isNew ? null : Number(id);
  if (!isNew && (!Number.isInteger(rowId) || rowId! <= 0)) notFound();

  const row = rowId ? await getContentRow(table, rowId) : null;
  if (rowId && !row) notFound();

  return (
    <Section title={isNew ? `Add to ${def.title.toLowerCase()}` : `Edit ${def.title.toLowerCase()}`}>
      <ContentRowForm def={def} row={row} />
    </Section>
  );
}
