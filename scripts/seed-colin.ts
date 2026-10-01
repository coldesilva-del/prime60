/**
 * Idempotent seed for Colin's account (user one). Fills gaps only; never
 * overwrites something he has already entered through onboarding.
 *
 * Run after Colin has signed up and verified:
 *   SEED_EMAIL=col.de.silva@gmail.com npx tsx scripts/seed-colin.ts
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* no .env.local */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email = process.env.SEED_EMAIL ?? "col.de.silva@gmail.com";
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`No auth user with email ${email}. Sign up first.`);
  const uid = user.id;

  // Admin flag and profile basics.
  await admin
    .from("profiles")
    .update({ is_admin: true, first_name: "Colin", timezone: "Australia/Brisbane", target_year: 2031, health_mode: "coached", weigh_in_dow: 1 })
    .eq("user_id", uid);

  // Health targets.
  await admin.from("health_targets").upsert(
    {
      user_id: uid,
      starting_weight: 69.5,
      starting_body_fat: 11,
      target_weight: 77,
      target_body_fat_low: 10,
      target_body_fat_high: 12,
      resistance_per_week: 4,
      cardio_per_week: 5,
      cardio_calories_per_session: 350,
      steps_per_day: 16000,
    },
    { onConflict: "user_id", ignoreDuplicates: false },
  );

  // People groups and people.
  const groups: Array<{ key: "partner" | "children" | "family" | "friends" | "community"; label: string; cadence: number; sort: number }> = [
    { key: "partner", label: "Partner", cadence: 1, sort: 1 },
    { key: "children", label: "Children", cadence: 7, sort: 2 },
    { key: "family", label: "Family", cadence: 7, sort: 3 },
    { key: "friends", label: "Friends", cadence: 14, sort: 4 },
    { key: "community", label: "Community", cadence: 30, sort: 5 },
  ];
  const groupIds: Record<string, number> = {};
  for (const g of groups) {
    const { data } = await admin
      .from("people_groups")
      .upsert({ user_id: uid, key: g.key, label: g.label, default_cadence_days: g.cadence, sort_order: g.sort }, { onConflict: "user_id,key" })
      .select("id")
      .single();
    groupIds[g.key] = data!.id;
  }
  const people = [
    { name: "Christine", group: "partner", cadence: 1 },
    { name: "Olivia", group: "children", cadence: 7 },
    { name: "Ethan", group: "children", cadence: 7 },
    { name: "Mum", group: "family", cadence: 7 },
  ];
  const { data: existingPeople } = await admin.from("people").select("name").eq("user_id", uid);
  const have = new Set((existingPeople ?? []).map((p) => p.name));
  for (const p of people) {
    if (have.has(p.name)) continue;
    await admin.from("people").insert({ user_id: uid, group_id: groupIds[p.group], name: p.name, cadence_days: p.cadence });
  }

  // Non-negotiables: Train, Publish, Connect.
  const { data: nn } = await admin.from("non_negotiables").select("id").eq("user_id", uid).eq("is_active", true);
  if ((nn ?? []).length === 0) {
    await admin.from("non_negotiables").insert([
      { user_id: uid, label: "Train", pillar: "health", score_key: "h1", sort_order: 1 },
      { user_id: uid, label: "Publish", pillar: "purpose", score_key: "p1", sort_order: 2 },
      { user_id: uid, label: "Connect", pillar: "relationships", score_key: "r1", sort_order: 3 },
    ]);
  }

  // Patterns in focus.
  const focus = ["procrastination", "not_finishing", "chasing_misaligned", "hiding", "overthinking"];
  const { data: library } = await admin.from("pattern_library").select("id, slug");
  for (const row of library ?? []) {
    await admin
      .from("user_patterns")
      .upsert({ user_id: uid, pattern_id: row.id, in_focus: focus.includes(row.slug) }, { onConflict: "user_id,pattern_id", ignoreDuplicates: true });
  }

  // Identity statement.
  const { data: ids } = await admin.from("identity_statements").select("id").eq("user_id", uid);
  if ((ids ?? []).length === 0) {
    await admin.from("identity_statements").insert({ user_id: uid, body: "I am a man who shares his ideas even when it is uncomfortable.", is_primary: true });
  }

  // North Star from the worked examples when empty.
  const { data: snippets } = await admin.from("content_snippets").select("key, body").like("key", "example_%");
  const bySection: Record<string, string> = {};
  for (const s of snippets ?? []) bySection[s.key.replace("example_", "")] = s.body;
  for (const section of ["health", "purpose", "relationships", "lifestyle", "moment"] as const) {
    await admin
      .from("north_stars")
      .upsert({ user_id: uid, section, body: bySection[section] ?? "" }, { onConflict: "user_id,section", ignoreDuplicates: true });
  }

  // Projects: the three active initiatives.
  const { data: projects } = await admin.from("projects").select("name").eq("user_id", uid);
  const haveProjects = new Set((projects ?? []).map((p) => p.name));
  const seedProjects = [
    { name: "Website business for small businesses", next: "Send the next proposal", done: "Three paying website clients" },
    { name: "Prime 60", next: "Complete onboarding and first week of check-ins", done: "100 founding members using it daily" },
    { name: "AI project-management product", next: "Finish the current workbook tab", done: "First 100 free users onboarded" },
  ];
  const today = new Date().toISOString().slice(0, 10);
  for (const p of seedProjects) {
    if (haveProjects.has(p.name)) continue;
    const { data: created } = await admin
      .from("projects")
      .insert({ user_id: uid, name: p.name, pillar: "purpose", status: "active", started_on: today, next_action: p.next, definition_of_done: p.done })
      .select("id")
      .single();
    if (created) {
      await admin.from("project_status_history").insert({ user_id: uid, project_id: created.id, from_status: null, to_status: "active" });
    }
  }

  // Habit stacks from the brief.
  const { data: stacks } = await admin.from("habit_stacks").select("id").eq("user_id", uid);
  if ((stacks ?? []).length === 0) {
    await admin.from("habit_stacks").insert([
      { user_id: uid, anchor: "morning coffee", behaviour: "review today's priorities", sort_order: 1 },
      { user_id: uid, anchor: "the gym", behaviour: "quick health check-in", sort_order: 2 },
      { user_id: uid, anchor: "breakfast", behaviour: "beach walk", sort_order: 3 },
      { user_id: uid, anchor: "starting work", behaviour: "identify the one thing to finish", sort_order: 4 },
      { user_id: uid, anchor: "lunch", behaviour: "relationship check", sort_order: 5 },
      { user_id: uid, anchor: "stopping work", behaviour: "capture what was completed", sort_order: 6 },
      { user_id: uid, anchor: "getting into bed", behaviour: "two-minute review", sort_order: 7 },
    ]);
  }

  console.log(`Seeded ${email} (${uid}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
