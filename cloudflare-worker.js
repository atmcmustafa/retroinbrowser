// Worker entry (wrangler.jsonc "main"): OpenNext's worker behind Cloudflare's edge cache.
// Even a prebuilt page costs the free plan's whole 10 ms of CPU to route and read from OpenNext's
// cache (the home page 20-40 ms), while a cache hit here costs about 1 ms. Keys carry the
// deployed version, so each deploy starts a fresh cache and nothing needs purging.
import openNext from "./.open-next/worker.js";

// The request headers Next varies its responses on (its Vary header). Cloudflare's cache ignores
// Vary, so they go into the key.
const VARIED = [
  "rsc",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-router-state-tree",
  "next-url",
];

const worker = {
  async fetch(request, env, ctx) {
    // Signed-in requests go through middleware, which refreshes the session cookie.
    if (
      request.method !== "GET" ||
      /(?:^|;\s*)rib-auth/.test(request.headers.get("cookie") ?? "")
    ) {
      return openNext.fetch(request, env, ctx);
    }
    const key = await cacheKey(request, env);
    const hit = await caches.default.match(key);
    if (hit) return hit;
    const response = await openNext.fetch(request, env, ctx);
    if (shared(response)) ctx.waitUntil(caches.default.put(key, response.clone()));
    return response;
  },
};
export default worker;

async function cacheKey(request, env) {
  const url = new URL(request.url);
  url.searchParams.set("__v", env.CF_VERSION_METADATA?.id ?? "dev");
  const varied = VARIED.map((name) => request.headers.get(name) ?? "").join("\n");
  if (varied.trim()) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(varied));
    url.searchParams.set("__h", btoa(String.fromCharCode(...new Uint8Array(digest))));
  }
  return new Request(url, { method: "GET" });
}

// Only prerendered responses Next marks as shareable (s-maxage); session and comment APIs are
// no-store, and redirects and errors are left alone.
function shared(response) {
  const control = response.headers.get("cache-control") ?? "";
  return (
    response.status === 200 &&
    !response.headers.has("set-cookie") &&
    /s-maxage=\d+/.test(control) &&
    !/private|no-store/.test(control)
  );
}
