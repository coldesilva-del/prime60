/**
 * Creates (or recreates) a verified test user for walking the app locally
 * without reading email. Prints the credentials. Delete the user afterwards
 * from the Supabase dashboard or by running this script with DELETE_ONLY=1.
 *
 *   npx tsx scripts/make-test-user.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

async function main() {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const email = process.env.TEST_EMAIL ?? "test-mark@prime60.test";
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of list.users) {
    if (u.email === email) {
      await admin.auth.admin.deleteUser(u.id);
      console.log("deleted existing", email);
    }
  }
  if (process.env.DELETE_ONLY) return;

  const password = "Prime60-test-" + Math.random().toString(36).slice(2, 10);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Mark", marketing_consent: false },
  });
  if (error) throw error;
  console.log(JSON.stringify({ email, password, id: data.user!.id }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
