import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Group, Section } from "@/components/layout/section";
import { CONTENT_DEFS, CONTENT_TABLES } from "@/lib/admin/content-config";

export const metadata: Metadata = { title: "Content" };

export default function AdminContentPage() {
  return (
    <Section title="Content" description="Methodology is content, not code. Edits apply to everyone at once.">
      <Group>
        {CONTENT_TABLES.map((table) => {
          const def = CONTENT_DEFS[table];
          return (
            <Link
              key={table}
              href={`/more/admin/content/${table}`}
              className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-raised"
            >
              <span className="min-w-0">
                <span className="block text-base text-ink">{def.title}</span>
                <span className="block text-sm text-ink-soft">{def.description}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-ink-faint" strokeWidth={1.5} aria-hidden />
            </Link>
          );
        })}
      </Group>
    </Section>
  );
}
