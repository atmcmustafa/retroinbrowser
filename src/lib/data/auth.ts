import "server-only";
import { cacheLife } from "next/cache";
import { oauthProviders, type OAuthProvider } from "@/lib/auth-providers";
import { env } from "@/lib/env";

// The login page offers whichever providers are switched on in Supabase Auth, read when the site
// is built: turning one on or off shows up with the next deploy. A short life would set the
// page's revalidate (with "minutes", every Sign in prefetch rebuilt /login once a minute).
export async function getEnabledProviders(): Promise<OAuthProvider[]> {
  "use cache";
  cacheLife("max");

  const res = await fetch(new URL("/auth/v1/settings", env.NEXT_PUBLIC_SUPABASE_URL), {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Auth settings responded ${res.status}`);
  const { external } = (await res.json()) as { external?: Record<string, boolean | undefined> };
  return oauthProviders.filter((provider) => external?.[provider] === true);
}
