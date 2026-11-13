// Draws each published game's share image and stores it in the artwork bucket as
// og/<slug>-<hash>.jpg (src/lib/og-image.ts). Game pages link that file, so this runs before
// every deploy build; only games whose drawn content changed get a new image, and images no
// game uses any more are removed.
// Usage: npm run og            draw what's missing, remove what's stale
//        npm run og -- --brand also write the site-wide card to src/app/opengraph-image.png
import { writeFile } from "node:fs/promises";
import { artworkBucket } from "@/lib/images";
import { ogImagePath, type OgGame } from "@/lib/og-image";
import { createScriptClient } from "./lib/db";
import { drawBrandCard, drawGameCard } from "./lib/og";

const CONCURRENCY = 4;

const supabase = createScriptClient();
const bucket = supabase.storage.from(artworkBucket);

async function storedImages() {
  const names = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket.list("og", { limit: 1000, offset });
    if (error) throw error;
    for (const { name } of data) names.add(`og/${name}`);
    if (data.length < 1000) return names;
  }
}

async function publishedGames(): Promise<OgGame[]> {
  const { data, error } = await supabase
    .from("games")
    .select(
      "slug, title, original_title, hero_url, cover_url, mobile_support, gamepad_support, requires_own_files, platform:platforms(name, color)",
    )
    .eq("status", "published")
    .limit(5000);
  if (error) throw error;
  return data;
}

async function main() {
  if (process.argv.includes("--brand")) {
    await writeFile("src/app/opengraph-image.png", await drawBrandCard());
    console.log("Wrote src/app/opengraph-image.png");
  }

  const [games, stored] = await Promise.all([publishedGames(), storedImages()]);
  const wanted = new Map(games.map((game) => [ogImagePath(game), game]));
  const missing = [...wanted].filter(([path]) => !stored.has(path));
  console.log(`${games.length} games, ${stored.size} stored images, ${missing.length} to draw.`);

  let failed = 0;
  for (let index = 0; index < missing.length; index += CONCURRENCY) {
    await Promise.all(
      missing.slice(index, index + CONCURRENCY).map(async ([path, game]) => {
        try {
          const { error } = await bucket.upload(path, await drawGameCard(game), {
            contentType: "image/jpeg",
            cacheControl: "31536000",
            upsert: true,
          });
          if (error) throw error;
          console.log(`drew ${path}`);
        } catch (error) {
          failed += 1;
          console.error(`Couldn't draw ${path}`, error);
        }
      }),
    );
  }

  const stale = [...stored].filter((path) => !wanted.has(path));
  if (stale.length) {
    const { error } = await bucket.remove(stale);
    if (error) console.error("Removing stale images failed", error);
    else console.log(`Removed ${stale.length} stale images.`);
  }

  // A missing image only costs a share preview, so a failure doesn't stop the deploy.
  if (failed) console.warn(`${failed} images failed; their pages share without a preview image.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
