/**
 * Row Level Security isolation test against the live Supabase project.
 *
 * Creates two throwaway users with the service role, writes rows as each user
 * through the normal client, and asserts that neither can read, update or
 * delete the other's rows, that content tables are read-only for them, and
 * that founding numbers are assigned on verification. Cleans up afterwards.
 *
 * Run:  npx tsx scripts/rls-test.ts
 * Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and
 * SUPABASE_SERVICE_ROLE_KEY in the environment (or .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : " " + JSON.stringify(detail)}`);
  if (!ok) failures += 1;
}

async function makeUser(tag: string) {
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("no user");
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function main() {
  // The test users claim founding numbers; remember the counter to put it back.
  const { data: before } = await admin.from("founding_counter" as never).select("claimed").eq("id", 1).maybeSingle<{ claimed: number }>();
  const a = await makeUser("a");
  const b = await makeUser("b");
  try {
    // Profiles exist via trigger and are private.
    const { data: aProfile } = await a.client.from("profiles").select("user_id, plan, founding_number").eq("user_id", a.id).maybeSingle();
    check("profile row created by trigger", aProfile?.user_id === a.id, aProfile);
    const { data: crossProfile } = await a.client.from("profiles").select("user_id").eq("user_id", b.id);
    check("cannot read another profile", (crossProfile ?? []).length === 0, crossProfile);

    // Founding numbers assigned on verification (createUser with email_confirm sets confirmed_at).
    check("founding number assigned or plan early_access", aProfile?.plan === "founding" ? aProfile.founding_number != null : aProfile?.plan === "early_access", aProfile);

    // Cannot promote self to admin or change plan.
    await a.client.from("profiles").update({ is_admin: true, plan: "paid" }).eq("user_id", a.id);
    const { data: afterGuard } = await a.client.from("profiles").select("is_admin, plan").eq("user_id", a.id).single();
    check("cannot self-promote to admin", afterGuard?.is_admin === false && afterGuard?.plan !== "paid", afterGuard);

    // Own rows write and read.
    const { error: insA } = await a.client.from("projects").insert({ user_id: a.id, name: "A project", pillar: "purpose" });
    check("insert own project", !insA, insA);
    const { data: aProjects } = await a.client.from("projects").select("id").eq("user_id", a.id);
    check("read own project", (aProjects ?? []).length === 1, aProjects);

    // Cross-user reads return nothing; cross-user inserts are rejected.
    const { data: bSees } = await b.client.from("projects").select("id");
    check("other user sees no projects", (bSees ?? []).length === 0, bSees);
    const { error: spoof } = await b.client.from("projects").insert({ user_id: a.id, name: "Spoof", pillar: "purpose" });
    check("cannot insert a row owned by another user", !!spoof, spoof);

    // Cross-user update and delete affect zero rows.
    const projectId = aProjects![0].id;
    const { data: upd } = await b.client.from("projects").update({ name: "Hacked" }).eq("id", projectId).select("id");
    check("cannot update another user's row", (upd ?? []).length === 0, upd);
    const { data: del } = await b.client.from("projects").delete().eq("id", projectId).select("id");
    check("cannot delete another user's row", (del ?? []).length === 0, del);
    const { data: still } = await a.client.from("projects").select("name").eq("id", projectId).single();
    check("row unchanged", still?.name === "A project", still);

    // Content tables: readable, not writable.
    const { data: patterns } = await a.client.from("pattern_library").select("id").limit(1);
    check("content readable", (patterns ?? []).length === 1, patterns);
    const { error: contentWrite } = await a.client.from("pattern_library").insert({ slug: "x", name: "x", description: "x", replacement: "x", if_then: "x" });
    check("content not writable by users", !!contentWrite, contentWrite);

    // Founding counter is unreachable.
    const { error: counter } = await a.client.from("founding_counter").select("*");
    check("founding counter not readable", !!counter, counter);

    // Views respect RLS.
    await a.client.from("daily_entries").insert({ user_id: a.id, entry_date: "2026-01-01", score: 50, evening_done_at: new Date().toISOString() });
    const { data: bView } = await b.client.from("v_daily_scores").select("*");
    check("view hides other users' scores", (bView ?? []).length === 0, bView);

    // Anonymous role sees nothing.
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: anonRead, error: anonErr } = await anon.from("profiles").select("user_id");
    check("anon cannot read profiles", !!anonErr || (anonRead ?? []).length === 0, { anonRead, anonErr });
  } finally {
    await admin.auth.admin.deleteUser(a.id);
    await admin.auth.admin.deleteUser(b.id);
    // Cascade removes their rows. Return the founding numbers they claimed.
    if (before) {
      await admin.from("founding_counter" as never).update({ claimed: before.claimed } as never).eq("id", 1);
    }
  }
  console.log(failures === 0 ? "\nAll RLS checks passed." : `\n${failures} RLS check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
