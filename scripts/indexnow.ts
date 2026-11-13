import { env } from "@/lib/env";
import { submitToIndexNow } from "@/lib/indexnow";
import { createScriptClient } from "./lib/db";

// Admin edits ping IndexNow on their own; this covers everything else.
//   npm run indexnow               every sitemap URL, for a first submission
//   npm run indexnow -- --changed  games changed lately by any means; deploy.yml runs it after each deploy
//   add --dry-run to print the URLs instead of sending them
// By hand, against the live site: NEXT_PUBLIC_SITE_URL=https://retroinbrowser.com npm run indexnow

// Over a day, because scheduled runs can start late. A URL sent twice does no harm.
const CHANGED_HOURS = 26;

async function sitemapPaths() {
  const res = await fetch(new URL("/sitemap.xml", env.NEXT_PUBLIC_SITE_URL));
  if (!res.ok) throw new Error(`sitemap.xml answered ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );
}

// Hidden games stay in: their pages are gone, and engines want to hear about that too.
async function changedPaths() {
  const since = new Date(Date.now() - CHANGED_HOURS * 3_600_000).toISOString();
  const { data, error } = await createScriptClient()
    .from("games")
    .select("slug")
    .neq("status", "draft")
    .gte("updated_at", since);
  if (error) throw error;
  if (data.length === 0) return [];
  return ["/", "/new", ...data.map(({ slug }) => `/games/${slug}`)];
}

async function main() {
  const paths = process.argv.includes("--changed") ? await changedPaths() : await sitemapPaths();
  if (paths.length === 0) {
    console.log("Nothing to send.");
    return;
  }
  if (process.argv.includes("--dry-run")) {
    console.log(paths.join("\n"));
    return;
  }
  const ok = await submitToIndexNow(paths);
  console.log(ok ? `Sent ${paths.length} URLs to IndexNow.` : "IndexNow didn't take the URLs.");
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
