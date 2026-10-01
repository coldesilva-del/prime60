import { todayIn, type DayString } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { GroupKey, InteractionKind, InteractionRow, PeopleGroupRow, PersonRow } from "@/lib/supabase/types";

export interface PersonSummary {
  id: number;
  name: string;
  cadenceDays: number;
  lastOn: DayString | null;
  connectedToday: boolean;
}

export interface GroupWithPeople {
  id: number;
  key: GroupKey;
  label: string;
  defaultCadenceDays: number;
  people: PersonSummary[];
}

export interface PeopleData {
  today: DayString;
  groups: GroupWithPeople[];
  hasGroups: boolean;
}

export async function loadPeople(): Promise<PeopleData> {
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const supabase = await createClient();
  const userId = profile.user_id;

  const [{ data: groups }, { data: people }, { data: interactions }] = await Promise.all([
    supabase.from("people_groups").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    supabase.from("people").select("*").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: true }),
    supabase
      .from("interactions")
      .select("person_id, occurred_on, kind")
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false })
      .limit(2000),
  ]);

  const rows = interactions ?? [];
  const lastByPerson = new Map<number, DayString>();
  const todayByPerson = new Set<number>();
  for (const i of rows) {
    if (!lastByPerson.has(i.person_id)) lastByPerson.set(i.person_id, i.occurred_on);
    if (i.occurred_on === today && i.kind === "contact") todayByPerson.add(i.person_id);
  }

  const out: GroupWithPeople[] = (groups ?? []).map((g: PeopleGroupRow) => ({
    id: g.id,
    key: g.key,
    label: g.label,
    defaultCadenceDays: g.default_cadence_days,
    people: (people ?? [])
      .filter((p: PersonRow) => p.group_id === g.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        cadenceDays: p.cadence_days,
        lastOn: lastByPerson.get(p.id) ?? null,
        connectedToday: todayByPerson.has(p.id),
      })),
  }));

  return { today, groups: out, hasGroups: (groups ?? []).length > 0 };
}

export interface PersonDetail {
  today: DayString;
  person: PersonRow;
  group: PeopleGroupRow | null;
  isPartner: boolean;
  recent: Pick<InteractionRow, "id" | "occurred_on" | "kind" | "connection_rating" | "note">[];
  lastOn: DayString | null;
}

export async function loadPerson(id: number): Promise<PersonDetail | null> {
  const profile = await requireProfile();
  const today = todayIn(profile.timezone);
  const supabase = await createClient();
  const userId = profile.user_id;

  const { data: person } = await supabase.from("people").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  if (!person) return null;

  const [{ data: group }, { data: recent }] = await Promise.all([
    supabase.from("people_groups").select("*").eq("user_id", userId).eq("id", person.group_id).maybeSingle(),
    supabase
      .from("interactions")
      .select("id, occurred_on, kind, connection_rating, note")
      .eq("user_id", userId)
      .eq("person_id", id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    today,
    person,
    group: group ?? null,
    isPartner: group?.key === "partner",
    recent: recent ?? [],
    lastOn: recent?.[0]?.occurred_on ?? null,
  };
}

export type { InteractionKind };
