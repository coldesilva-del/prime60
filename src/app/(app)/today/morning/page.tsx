import type { Metadata } from "next";
import { requireProfile } from "@/lib/profile";
import { todayIn } from "@/lib/dates";
import { loadMorning } from "@/lib/daily/queries";
import { MorningFlow } from "./morning-flow";

export const metadata: Metadata = { title: "Morning" };

export default async function MorningPage() {
  const profile = await requireProfile();
  const day = todayIn(profile.timezone);
  const data = await loadMorning(profile, day);
  const { entry, yesterday } = data;

  return (
    <MorningFlow
      identity={data.identity?.body ?? null}
      nonNegotiables={data.nonNegotiables.map((n) => ({ id: n.id, label: n.label }))}
      yesterday={
        yesterday?.one_thing && yesterday.finished_one_thing !== true
          ? { oneThing: yesterday.one_thing, projectId: yesterday.one_thing_project_id }
          : null
      }
      projects={data.projects}
      courageRepTypes={data.courageRepTypes.map((t) => ({ id: t.id, label: t.label }))}
      people={data.people.map((p) => ({ id: p.id, name: p.name, groupLabel: p.groupLabel }))}
      initial={{
        oneThing: entry.one_thing ?? "",
        oneThingProjectId: entry.one_thing_project_id,
        courageIntentTypeId: entry.courage_intent_type_id,
        personId: entry.person_id,
      }}
    />
  );
}
