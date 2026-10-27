import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

const cardColumns =
  "id, slug, title, original_title, cover_url, mobile_support, gamepad_support, requires_own_files, platform:platforms(slug, name, short_name, color)";
const featuredColumns = `${cardColumns}, hero_url, summary` as const;
const genreCardColumns = `${cardColumns}, game_genres!inner(genre_id)` as const;
const detailColumns =
  `${cardColumns}, platform_id, play_url, source_url, developer, summary, tech, hero_url, link_status, published_at, genres:game_genres(genre:genres(id, slug, name, sort))` as const;

// Cards embed platform names and colors, so taxonomy edits must expire these too.
function cacheCatalog() {
  cacheTag("games", "taxonomy");
  cacheLife("hours");
}

export async function getPopularGames(limit: number) {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select(cardColumns)
    .eq("status", "published")
    .order("click_count", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export type GameCardData = Awaited<ReturnType<typeof getPopularGames>>[number];

export async function getNewGames(limit: number) {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select(cardColumns)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getGamesByGenre(genreId: number, limit: number) {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select(genreCardColumns)
    .eq("status", "published")
    .eq("game_genres.genre_id", genreId)
    .order("click_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getFeaturedGames(limit: number) {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select(featuredColumns)
    .eq("status", "published")
    .eq("featured", true)
    .not("hero_url", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.flatMap(({ hero_url, ...game }) => (hero_url ? [{ ...game, hero_url }] : []));
}

export type FeaturedGame = Awaited<ReturnType<typeof getFeaturedGames>>[number];

export async function getCatalogCounts() {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select("platform_id, game_genres(genre_id)")
    .eq("status", "published");
  if (error) throw error;

  const platforms: Record<number, number> = {};
  const genres: Record<number, number> = {};
  for (const game of data) {
    if (game.platform_id) platforms[game.platform_id] = (platforms[game.platform_id] ?? 0) + 1;
    for (const { genre_id } of game.game_genres) genres[genre_id] = (genres[genre_id] ?? 0) + 1;
  }
  return { total: data.length, platforms, genres };
}

export async function getPublishedSlugs() {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select("slug")
    .eq("status", "published");
  if (error) throw error;
  return data.map(({ slug }) => slug);
}

export async function getGameBySlug(slug: string) {
  "use cache";
  cacheCatalog();

  const { data, error } = await createPublicClient()
    .from("games")
    .select(detailColumns)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { genres, ...game } = data;
  return { ...game, genres: genres.map(({ genre }) => genre).sort((a, b) => a.sort - b.sort) };
}

export type GameDetail = NonNullable<Awaited<ReturnType<typeof getGameBySlug>>>;

export async function getSimilarGames(
  gameId: string,
  genreIds: number[],
  platformId: number | null,
  limit: number,
) {
  "use cache";
  cacheCatalog();

  const client = createPublicClient();
  const similar: GameCardData[] = [];

  if (genreIds.length) {
    const { data, error } = await client
      .from("games")
      .select(genreCardColumns)
      .eq("status", "published")
      .neq("id", gameId)
      .in("game_genres.genre_id", genreIds)
      .order("click_count", { ascending: false })
      .limit(limit * 3);
    if (error) throw error;
    // The inner join keeps only matching genres, so length is the overlap; sort is stable,
    // so popularity still breaks ties.
    similar.push(...data.sort((a, b) => b.game_genres.length - a.game_genres.length));
  }

  if (similar.length < limit && platformId) {
    const { data, error } = await client
      .from("games")
      .select(cardColumns)
      .eq("status", "published")
      .eq("platform_id", platformId)
      .neq("id", gameId)
      .order("click_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    similar.push(...data.filter((game) => !similar.some(({ id }) => id === game.id)));
  }

  return similar.slice(0, limit);
}
