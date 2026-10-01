import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConsentedUsers } from "@/lib/admin/queries";

function csvCell(value: string): string {
  // Guard against spreadsheet formula injection as well as quoting.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Admin only. Email, first name and consent date for everyone who opted in. */
export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", userId).maybeSingle();
  if (!profile?.is_admin) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  let rows;
  try {
    rows = await getConsentedUsers();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const lines = ["email,first_name,consent_date"];
  for (const r of rows) {
    lines.push([csvCell(r.email), csvCell(r.firstName), csvCell(r.consentedAt)].join(","));
  }
  const day = new Date().toISOString().slice(0, 10);

  return new NextResponse(lines.join("\r\n") + "\r\n", {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prime60-consented-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
