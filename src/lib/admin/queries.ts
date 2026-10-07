import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { addDays, weekStart } from "@/lib/dates";
import type { ContentTable } from "./content-config";

/** Every auth user, paged through the admin API. */
async function listAllUsers(): Promise<User[]> {
  const admin = createAdminClient();
  const users: User[] = [];
  const perPage = 1000;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Could not list users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return users;
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  foundingClaimed: number;
  active7: number;
  active28: number;
  signupsPerWeek: { weekStart: string; count: number }[];
  configured: boolean;
  error?: string;
}

export const getAdminStats = cache(async (): Promise<AdminStats> => {
  const empty: AdminStats = {
    totalUsers: 0,
    verifiedUsers: 0,
    foundingClaimed: 0,
    active7: 0,
    active28: 0,
    signupsPerWeek: [],
    configured: true,
  };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { ...empty, configured: false, error: err instanceof Error ? err.message : "Admin client unavailable." };
  }

  const now = new Date();
  const since7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const since28 = new Date(now.getTime() - 28 * 86400000).toISOString();

  const [users, founding, entries7, entries28] = await Promise.all([
    listAllUsers(),
    admin.from("profiles").select("user_id", { count: "exact", head: true }).eq("plan", "founding"),
    admin.from("daily_entries").select("user_id").gte("evening_done_at", since7),
    admin.from("daily_entries").select("user_id").gte("evening_done_at", since28),
  ]);

  const verified = users.filter((u) => Boolean(u.email_confirmed_at)).length;

  // Sign-ups per week, last 12 weeks, Monday-led, UTC.
  const todayUtc = now.toISOString().slice(0, 10);
  const thisWeek = weekStart(todayUtc);
  const weeks: { weekStart: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) weeks.push({ weekStart: addDays(thisWeek, -7 * i), count: 0 });
  const index = new Map(weeks.map((w, i) => [w.weekStart, i]));
  for (const u of users) {
    if (!u.created_at) continue;
    const ws = weekStart(u.created_at.slice(0, 10));
    const i = index.get(ws);
    if (i !== undefined) weeks[i].count += 1;
  }

  return {
    totalUsers: users.length,
    verifiedUsers: verified,
    foundingClaimed: founding.count ?? 0,
    active7: new Set((entries7.data ?? []).map((r) => r.user_id)).size,
    active28: new Set((entries28.data ?? []).map((r) => r.user_id)).size,
    signupsPerWeek: weeks,
    configured: true,
  };
});

export interface PageViewRow {
  path: string;
  views: number;
  topReferrers: { host: string; views: number }[];
}

/** Page views on the public pages over the last 30 days, by path, with the top referring sites. */
export const getPageViews = cache(async (): Promise<PageViewRow[]> => {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data } = await admin
    .from("page_views" as never)
    .select("path, referrer_host, views")
    .gte("day", since)
    .returns<{ path: string; referrer_host: string; views: number }[]>();
  const byPath = new Map<string, { views: number; refs: Map<string, number> }>();
  for (const row of data ?? []) {
    const entry = byPath.get(row.path) ?? { views: 0, refs: new Map<string, number>() };
    entry.views += row.views;
    if (row.referrer_host) entry.refs.set(row.referrer_host, (entry.refs.get(row.referrer_host) ?? 0) + row.views);
    byPath.set(row.path, entry);
  }
  return [...byPath.entries()]
    .map(([path, e]) => ({
      path,
      views: e.views,
      topReferrers: [...e.refs.entries()]
        .map(([host, views]) => ({ host, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 3),
    }))
    .sort((a, b) => b.views - a.views);
});

export interface ConsentedRow {
  email: string;
  firstName: string;
  consentedAt: string;
}

/** Users who have opted in to marketing email, joined to their auth email. */
export async function getConsentedUsers(): Promise<ConsentedRow[]> {
  const admin = createAdminClient();
  const [users, profiles] = await Promise.all([
    listAllUsers(),
    admin.from("profiles").select("user_id, first_name, marketing_consent_at").eq("marketing_consent", true),
  ]);
  if (profiles.error) throw new Error(`Could not read profiles: ${profiles.error.message}`);

  const emailById = new Map(users.map((u) => [u.id, u.email ?? ""]));
  const rows: ConsentedRow[] = [];
  for (const p of profiles.data ?? []) {
    const email = emailById.get(p.user_id);
    if (!email) continue;
    rows.push({ email, firstName: p.first_name ?? "", consentedAt: p.marketing_consent_at ?? "" });
  }
  rows.sort((a, b) => a.email.localeCompare(b.email));
  return rows;
}

// ---------------------------------------------------------------------------
// Content (normal client; RLS lets admins read inactive rows and write)
// ---------------------------------------------------------------------------

export type ContentRow = Record<string, string | number | boolean | null>;

export async function listContentRows(table: ContentTable, orderBy: string): Promise<ContentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*").order(orderBy).order("id");
  if (error) throw new Error(`Could not load ${table}: ${error.message}`);
  return (data ?? []) as ContentRow[];
}

export async function getContentRow(table: ContentTable, id: number): Promise<ContentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load ${table}: ${error.message}`);
  return (data as ContentRow | null) ?? null;
}
