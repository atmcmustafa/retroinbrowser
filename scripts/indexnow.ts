import { env } from "@/lib/env";
import { submitToIndexNow } from "@/lib/indexnow";

// Sends every sitemap URL to IndexNow. Admin edits ping on their own; this is for the first
// submission and after bulk SQL edits. Run against the live site:
// NEXT_PUBLIC_SITE_URL=https://retroinbrowser.com npm run indexnow
async function main() {
  const res = await fetch(new URL("/sitemap.xml", env.NEXT_PUBLIC_SITE_URL));
  if (!res.ok) throw new Error(`sitemap.xml answered ${res.status}`);
  const paths = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );
  const ok = await submitToIndexNow(paths);
  console.log(ok ? `Sent ${paths.length} URLs to IndexNow.` : "IndexNow didn't take the URLs.");
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
