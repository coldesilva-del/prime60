import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Group, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "More" };

const links: { href: string; label: string; description: string }[] = [
  { href: "/more/people", label: "People", description: "The people who matter and how often you connect." },
  { href: "/more/patterns", label: "Patterns", description: "Old patterns in focus, replacements and IF-THEN plans." },
  { href: "/more/habit-stacks", label: "Habit stacks", description: "Anchor new behaviour to what you already do." },
  { href: "/more/non-negotiables", label: "Non-negotiables", description: "Your three standing daily commitments." },
  { href: "/more/identity", label: "Identity statements", description: "Who you are becoming, in your own words." },
  { href: "/more/health", label: "Health", description: "Mode, fields, targets and programme." },
  { href: "/more/account", label: "Account", description: "Profile, theme, consent, export and deletion." },
  { href: "/more/guide", label: "Guide", description: "How Prime 60 works, in ten minutes." },
  { href: "/install", label: "Install on your phone", description: "Add Prime 60 to your home screen." },
];

export default async function MorePage() {
  const profile = await requireProfile();
  const items = profile.is_admin
    ? [...links, { href: "/more/admin", label: "Admin", description: "Members, activity and content." }]
    : links;

  return (
    <div className="space-y-8">
      <PageHeader title="More" />

      <Section>
        <Group>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-raised"
            >
              <span className="min-w-0">
                <span className="block text-base text-ink">{item.label}</span>
                <span className="block text-sm text-ink-soft">{item.description}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-ink-faint" strokeWidth={1.5} aria-hidden />
            </Link>
          ))}
        </Group>
      </Section>

      <div className="space-y-4">
        {profile.plan === "founding" && profile.founding_number ? (
          <p className="text-sm text-brass">Founding member {profile.founding_number} of 100</p>
        ) : (
          <p className="text-sm text-ink-soft">Early access</p>
        )}
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
