import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Edge middleware rather than Next 16's proxy.ts: proxy always runs on Node.js, which the
// Cloudflare adapter (OpenNext) can't host.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Middleware runs before the cache, so matching every path cost one invocation per page view,
// prefetch and crawler hit. Only a session needs refreshing: anonymous requests skip it, while
// /admin and /profile still redirect to /login here. The cookie names come from
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
