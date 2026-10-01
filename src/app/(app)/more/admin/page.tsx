import type { Metadata } from "next";
import { Group, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getAdminStats } from "@/lib/admin/queries";
import { formatDayShort } from "@/lib/dates";

export const metadata: Metadata = { title: "Admin" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-14 items-center justify-between px-4 py-3">
      <span className="text-base text-ink">{label}</span>
      <span className="text-lg font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}

export default async function AdminUsersPage() {
  const stats = await getAdminStats();

  if (!stats.configured) {
    return (
      <Section title="Users">
        <p className="text-base text-ink-soft">
          The service role key is not configured on the server, so member counts are unavailable.
        </p>
        <p className="text-sm text-ink-faint">{stats.error}</p>
      </Section>
    );
  }

  return (
    <div className="space-y-8">
      <Section title="Members">
        <Group>
          <Stat label="Total accounts" value={stats.totalUsers} />
          <Stat label="Verified" value={stats.verifiedUsers} />
          <Stat label="Founding claimed" value={stats.foundingClaimed} />
          <Stat label="Active in the last 7 days" value={stats.active7} />
          <Stat label="Active in the last 28 days" value={stats.active28} />
        </Group>
        <p className="text-sm text-ink-soft">Active means at least one evening check-in closed in the window.</p>
      </Section>

      <Section title="Sign-ups per week" description="Last 12 weeks, weeks starting Monday.">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th scope="col" className="py-2 font-medium">
                Week of
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Sign-ups
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.signupsPerWeek.map((w) => (
              <tr key={w.weekStart} className="border-t border-hairline">
                <td className="py-2 text-ink">{formatDayShort(w.weekStart)}</td>
                <td className="py-2 text-right tabular-nums text-ink">{w.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Mailing list" description="Members who opted in to email. Email, first name and consent date.">
        <Button variant="secondary" size="full" render={<a href="/more/admin/consented.csv" download />}>
          Download consented emails as CSV
        </Button>
      </Section>
    </div>
  );
}
