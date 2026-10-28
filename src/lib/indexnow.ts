import "server-only";
import { env } from "@/lib/env";

// IndexNow tells Bing (and Yandex, Seznam, Naver) about changed pages right away; Google doesn't
// take part and relies on the sitemap. The key isn't secret: engines read it from
// public/<key>.txt to confirm the ping comes from this site.
export const INDEXNOW_KEY = "a3eac549bd48e732953cd400d62b7895";

export async function submitToIndexNow(paths: string[]) {
  const site = new URL(env.NEXT_PUBLIC_SITE_URL);
  if (site.protocol !== "https:" || paths.length === 0) return false;

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: site.host,
        key: INDEXNOW_KEY,
        keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, site).href,
        urlList: [...new Set(paths)].map((path) => new URL(path, site).href),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.warn(`IndexNow answered ${res.status}`, await res.text());
    return res.ok;
  } catch (error) {
    console.warn("IndexNow ping failed", error);
    return false;
  }
}
