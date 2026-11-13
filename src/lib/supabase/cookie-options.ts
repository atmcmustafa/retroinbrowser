import type { CookieOptionsWithName } from "@supabase/ssr";
import { env } from "@/lib/env";

// Every Supabase call runs on the server, so page scripts never need the session tokens:
// an XSS bug can't read them, and they never travel over plain http.
// proxy.ts matches the name literally (rib-auth, and rib-auth.0 for a session split into
// chunks) to run only for signed-in visitors; rename both together.
export const authCookieOptions = {
  name: "rib-auth",
  httpOnly: true,
  secure: env.NEXT_PUBLIC_SITE_URL.startsWith("https://"),
  sameSite: "lax",
} satisfies CookieOptionsWithName;
