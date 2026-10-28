import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // Without a code, Supabase sent an error instead: an expired email link, or a Google or
  // Discord prompt the user cancelled.
  let failure = searchParams.get("error_code") ?? searchParams.get("error");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    failure = error.code ?? error.message;
  }
  // Logged, never shown: error_description is whatever text the URL carries.
  console.warn("Sign-in failed", failure, searchParams.get("error_description"));

  const login = new URL("/login", request.url);
  login.searchParams.set("error", failure === "otp_expired" ? "expired" : "failed");
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
