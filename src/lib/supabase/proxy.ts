import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_HINT, sessionHintMaxAge } from "@/lib/session-hint";
import { authCookieOptions } from "@/lib/supabase/cookie-options";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const { pathname } = request.nextUrl;

  if (!userId && (pathname.startsWith("/admin") || pathname.startsWith("/profile"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return syncSessionHint(request, NextResponse.redirect(url), false);
  }

  if (userId && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return syncSessionHint(request, response, Boolean(userId));
}

// Keeps the readable flag in step with the session: set while it's valid, dropped once it isn't.
function syncSessionHint(request: NextRequest, response: NextResponse, signedIn: boolean) {
  const hinted = request.cookies.has(SESSION_HINT);
  if (signedIn && !hinted) {
    response.cookies.set(SESSION_HINT, "1", {
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: sessionHintMaxAge,
    });
  }
  if (!signedIn && hinted) response.cookies.delete(SESSION_HINT);
  return response;
}
