import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { safeNext } from "@/lib/auth/schemas";

/**
 * PKCE callback for email verification, magic links and password recovery.
 * Supabase redirects here with ?code=... ; we exchange it for a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Behind the Railway proxy request.url carries the internal host, so
  // redirects are built from the configured public URL.
  const origin = publicEnv.NEXT_PUBLIC_APP_URL;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=link`);
}
