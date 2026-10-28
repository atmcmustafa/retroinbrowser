import type { CookieOptionsWithName } from "@supabase/ssr";
import { env } from "@/lib/env";

// Every Supabase call runs on the server, so page scripts never need the session tokens:
// an XSS bug can't read them, and they never travel over plain http.
export const authCookieOptions = {
  httpOnly: true,
  secure: env.NEXT_PUBLIC_SITE_URL.startsWith("https://"),
  sameSite: "lax",
} satisfies CookieOptionsWithName;
