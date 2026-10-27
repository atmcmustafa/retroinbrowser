import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

// Scripts write with the secret key, so no updateTag runs; ask the site to drop its caches.
export async function revalidateSite() {
  const secret = serverEnv.REVALIDATE_SECRET;
  const url = new URL("/api/revalidate", env.NEXT_PUBLIC_SITE_URL);
  if (!secret) {
    console.warn("REVALIDATE_SECRET is not set; the site may show stale data for up to an hour.");
    return false;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    console.log(`Site cache refreshed (${url.origin}).`);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Couldn't refresh the site cache at ${url.origin}: ${reason}`);
    return false;
  }
}
