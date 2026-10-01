import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { HabitStackSettings } from "@/components/patterns/habit-stack-settings";
import { requireProfile } from "@/lib/profile";
import { getHabitStacks } from "@/lib/patterns/habit-stacks/queries";

export const metadata: Metadata = { title: "Habit stacks" };

export default async function HabitStacksPage() {
  const profile = await requireProfile();
  const stacks = await getHabitStacks(profile.user_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habit stacks"
        backHref="/more"
        description="After an anchor you already do, a behaviour you want. Up to eight."
      />
      <HabitStackSettings stacks={stacks} />
    </div>
  );
}
