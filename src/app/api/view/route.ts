import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public pages whose views are counted. Anything else is ignored. */
const COUNTED = new Set(["/", "/letter", "/scorecard", "/sign-up", "/sign-in", "/install"]);

/**
 * First-party, cookieless page-view counting for the public pages. The browser
 * sends the path and its referrer; we keep a daily count per path and
 * referring site. No IP address, user agent or identifier is stored.
 */
export async function POST(request: NextRequest) {
  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const path = typeof body.path === "string" ? body.path : "";
  if (!COUNTED.has(path)) return new NextResponse(null, { status: 204 });

  let referrerHost = "";
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const host = new URL(body.referrer).hostname;
      if (host !== request.nextUrl.hostname) referrerHost = host;
    } catch {
      referrerHost = "";
    }
  }

  try {
    const admin = createAdminClient();
    await admin.rpc("count_page_view" as never, { p_path: path, p_referrer_host: referrerHost } as never);
  } catch {
    // Counting must never affect the visitor.
  }
  return new NextResponse(null, { status: 204 });
}
