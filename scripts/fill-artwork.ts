// Fills missing covers and heroes from SteamGridDB, picking the highest-scored image.
// Usage: npm run artwork -- [--dry-run] [slug ...]
// Existing artwork is never replaced; change a pick from /admin afterwards.
import type { Artwork, ArtworkGame } from "@/lib/images";
import { getSteamGridArtwork, searchSteamGridGames } from "@/lib/steamgriddb";
import { importArtwork, removeArtwork } from "@/lib/storage";
import { createScriptClient } from "./lib/db";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const slugs = args.filter((arg) => !arg.startsWith("--"));

const artworkField = { cover: "cover_url", hero: "hero_url" } as const;

function normalize(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const trailingYear = /\s*\((\d{4})\)\s*$/;

async function findSteamGridGame(originalTitle: string): Promise<ArtworkGame | null> {
  const year = Number(originalTitle.match(trailingYear)?.[1]) || null;
  const title = originalTitle.replace(trailingYear, "");
  const results = await searchSteamGridGames(title);
  const exact = results.filter((result) => normalize(result.name) === normalize(title));

  if (year) {
    const sameYear = exact.find((r) => r.year === year) ?? results.find((r) => r.year === year);
    if (sameYear) return sameYear;
  }
  // Remakes and reboots reuse names; for a classic-games directory the oldest release is the one.
  const oldest = exact.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999))[0];
  return oldest ?? results[0] ?? null;
}

function best(items: Artwork[]) {
  return [...items].sort((a, b) => b.score - a.score)[0] ?? null;
}

async function main() {
  const supabase = createScriptClient();
  let query = supabase
    .from("games")
    .select("id, slug, original_title, status, cover_url, hero_url, steamgriddb_id")
    .or("cover_url.is.null,hero_url.is.null")
    .order("slug");
  if (slugs.length) query = query.in("slug", slugs);

  const { data: games, error } = await query;
  if (error) throw error;
  if (!games.length) return console.log("Every selected game already has a cover and a hero.");

  let failures = 0;
  let publishedChanged = false;

  for (const game of games) {
    const uploaded: string[] = [];
    try {
      const match = game.steamgriddb_id
        ? { id: game.steamgriddb_id, name: `SteamGridDB #${game.steamgriddb_id}`, year: null }
        : await findSteamGridGame(game.original_title);
      if (!match) {
        console.log(`✗ ${game.slug}: no SteamGridDB match for "${game.original_title}"`);
        failures++;
        continue;
      }

      const update: { steamgriddb_id: number; cover_url?: string; hero_url?: string } = {
        steamgriddb_id: match.id,
      };
      const notes: string[] = [];
      for (const kind of ["cover", "hero"] as const) {
        const field = artworkField[kind];
        if (game[field]) continue;
        const pick = best(await getSteamGridArtwork(match.id, kind));
        if (!pick) {
          notes.push(`no ${kind}`);
          continue;
        }
        if (dryRun) {
          update[field] = pick.url;
        } else {
          update[field] = await importArtwork(supabase, pick.url, kind, game.slug);
          uploaded.push(update[field]);
        }
        notes.push(`${kind} by ${pick.author ?? "unknown"}`);
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("games")
          .update(update)
          .eq("id", game.id);
        if (updateError) throw updateError;
        if (game.status === "published") publishedChanged = true;
      }
      const year = match.year ? ` (${match.year})` : "";
      console.log(`✓ ${game.slug} → ${match.name}${year}: ${notes.join(", ")}`);
    } catch (error) {
      failures++;
      await removeArtwork(supabase, uploaded);
      console.error(`✗ ${game.slug}:`, error instanceof Error ? error.message : error);
    }
  }

  if (dryRun) console.log("\nDry run: nothing was uploaded or saved.");
  if (publishedChanged) {
    console.log("\nPublished games changed. Save any game in /admin to refresh the public cache.");
  }
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
