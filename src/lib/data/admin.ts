import "server-only";
import type { AdminGamesFilters } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";

type CountResult = { count: number | null; error: unknown };

function countOf({ count, error }: CountResult) {
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminStats() {
  const supabase = await createClient();
  const games = () => supabase.from("games").select("id", { count: "exact", head: true });

  const [published, drafts, pending, broken] = await Promise.all([
    games().eq("status", "published"),
    games().eq("status", "draft"),
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    games().eq("status", "published").eq("link_status", "broken"),
  ]);

  return {
    published: countOf(published),
    drafts: countOf(drafts),
    pending: countOf(pending),
    broken: countOf(broken),
  };
}

const sortColumns = {
  updated: { column: "updated_at", ascending: false },
  title: { column: "title", ascending: true },
  clicks: { column: "click_count", ascending: false },
} as const;

// PostgREST's or() syntax treats , ( ) " \ as structure, so keep only characters titles need.
function searchTerm(q: string) {
  return q
    .replace(/[^\p{L}\p{N}\s\-'!&.:]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export async function getAdminGames({ q, status, sort }: AdminGamesFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("games")
    .select(
      "id, slug, title, original_title, status, link_status, featured, click_count, cover_url, updated_at, platform:platforms(name, color)",
    )
    .limit(500);

  if (status) query = query.eq("status", status);
  const term = searchTerm(q);
  if (term) query = query.or(`title.ilike."%${term}%",original_title.ilike."%${term}%"`);

  const { column, ascending } = sortColumns[sort];
  const { data, error } = await query.order(column, { ascending }).order("title");
  if (error) throw error;
  return data;
}

export type AdminGameRow = Awaited<ReturnType<typeof getAdminGames>>[number];

export async function getAdminGame(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, slug, title, original_title, platform_id, play_url, source_url, developer, summary, tech, cover_url, hero_url, steamgriddb_id, requires_own_files, mobile_support, gamepad_support, featured, status, link_status, click_count, published_at, updated_at, game_genres(genre_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type AdminGame = NonNullable<Awaited<ReturnType<typeof getAdminGame>>>;

export async function getAdminTaxonomy() {
  const supabase = await createClient();
  const [platforms, genres] = await Promise.all([
    supabase
      .from("platforms")
      .select("id, slug, name, short_name, color, sort, games(count)")
      .order("sort")
      .order("name"),
    supabase
      .from("genres")
      .select("id, slug, name, icon, sort, game_genres(count)")
      .order("sort")
      .order("name"),
  ]);
  if (platforms.error) throw platforms.error;
  if (genres.error) throw genres.error;

  return {
    platforms: platforms.data.map(({ games, ...platform }) => ({
      ...platform,
      gameCount: games[0]?.count ?? 0,
    })),
    genres: genres.data.map(({ game_genres, ...genre }) => ({
      ...genre,
      gameCount: game_genres[0]?.count ?? 0,
    })),
  };
}

export type AdminTaxonomy = Awaited<ReturnType<typeof getAdminTaxonomy>>;
export type AdminPlatform = AdminTaxonomy["platforms"][number];
export type AdminGenre = AdminTaxonomy["genres"][number];
