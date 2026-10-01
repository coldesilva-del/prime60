import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Group, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { CONTENT_DEFS, isContentTable } from "@/lib/admin/content-config";
import { listContentRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentTablePage({ params }: PageProps<"/more/admin/content/[table]">) {
  const { table } = await params;
  if (!isContentTable(table)) notFound();
  const def = CONTENT_DEFS[table];
  const rows = await listContentRows(table, def.orderBy);

  return (
    <Section
      title={def.title}
      description={def.description}
      action={
        <Link href={`/more/admin/content/${table}/new`} className="inline-flex h-11 items-center text-sm font-medium text-harbour">
          Add
        </Link>
      }
    >
      {rows.length === 0 ? (
        <div className="space-y-3 py-6">
          <p className="text-base text-ink-soft">Nothing here yet.</p>
          <Button variant="secondary" render={<Link href={`/more/admin/content/${table}/new`} />}>
            Add the first one
          </Button>
        </div>
      ) : (
        <Group>
          {rows.map((row) => {
            const title = String(row[def.titleField] ?? "");
            const subtitle = def.subtitleField ? String(row[def.subtitleField] ?? "") : "";
            const inactive = row.is_active === false;
            return (
              <Link
                key={String(row.id)}
                href={`/more/admin/content/${table}/${row.id}`}
                className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-raised"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base text-ink">
                    {title}
                    {inactive ? <span className="text-ink-faint"> (inactive)</span> : null}
                  </span>
                  {subtitle ? <span className="block truncate text-sm text-ink-soft">{subtitle}</span> : null}
                </span>
                <ChevronRight className="size-5 shrink-0 text-ink-faint" strokeWidth={1.5} aria-hidden />
              </Link>
            );
          })}
        </Group>
      )}
    </Section>
  );
}
