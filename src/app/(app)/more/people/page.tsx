import type { Metadata } from "next";
import { EmptyState } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { GroupSection } from "@/components/relationships/group-section";
import { SeedGroupsButton } from "@/components/relationships/seed-groups-button";
import { loadPeople } from "@/lib/relationships/queries";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const data = await loadPeople();

  return (
    <div className="space-y-8">
      <PageHeader title="People" backHref="/more" description="The people who matter, and how often you want to connect." />
      {!data.hasGroups ? (
        <EmptyState action={<SeedGroupsButton />}>Set up your groups to start adding people.</EmptyState>
      ) : (
        data.groups.map((g) => <GroupSection key={g.id} group={g} today={data.today} />)
      )}
    </div>
  );
}
