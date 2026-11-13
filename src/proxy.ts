import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Proxy runs as a function before the CDN cache, so matching every path billed one invocation
// per page view, prefetch and crawler hit. Only a session needs refreshing: anonymous requests
// skip it, while /admin and /profile still redirect to /login here. The cookie names come from
// authCookieOptions (a long session is split into rib-auth.0, rib-auth.1, ...).
export const config = {
  matcher: [
    "/admin/:path*",
    "/profile",
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
      has: [{ type: "cookie", key: "rib-auth" }],
    },
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
      has: [{ type: "cookie", key: "rib-auth.0" }],
    },
  ],
};
