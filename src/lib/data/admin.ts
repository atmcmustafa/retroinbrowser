import "server-only";
import { toSearchTerm } from "@/lib/search";
import type { AdminGamesFilters } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { Constants, type Enums } from "@/types/database";

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

export async function getAdminGames({ q, status, sort }: AdminGamesFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("games")
    .select(
      "id, slug, title, original_title, status, link_status, featured, click_count, cover_url, updated_at, platform:platforms(name, color), link_checks(verdict)",
    )
    // Only the latest check: it carries verdicts that never reach the public row.
    .order("checked_at", { referencedTable: "link_checks", ascending: false })
    .limit(1, { referencedTable: "link_checks" })
    .limit(500);

  if (status) query = query.eq("status", status);
  const term = toSearchTerm(q);
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
      "id, slug, title, original_title, platform_id, play_url, source_url, developer, summary, description, tech, cover_url, hero_url, steamgriddb_id, requires_own_files, mobile_support, gamepad_support, featured, status, link_status, click_count, published_at, updated_at, game_genres(genre_id)",
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

// Keyed by lowercased original title: a candidate for a game already in the catalog is
// usually the same port found again, though a second port of the same game can be real.
export async function getListedGames() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("id, title, original_title");
  if (error) throw error;
  return Object.fromEntries(
    data.map(({ id, title, original_title }) => [original_title.toLowerCase(), { id, title }]),
  );
}

export type ListedGames = Awaited<ReturnType<typeof getListedGames>>;

export async function getAdminCandidates(status: Enums<"candidate_status">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, url, title, source, score, note, status, created_at, extracted, game:games(id, title), candidate_mentions(count)",
    )
    .eq("status", status)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export type AdminCandidateRow = Awaited<ReturnType<typeof getAdminCandidates>>[number];

export async function getCandidateCounts() {
  const supabase = await createClient();
  const statuses = Constants.public.Enums.candidate_status;
  const results = await Promise.all(
    statuses.map((status) =>
      supabase.from("candidates").select("id", { count: "exact", head: true }).eq("status", status),
    ),
  );
  return Object.fromEntries(statuses.map((status, i) => [status, countOf(results[i])])) as Record<
    Enums<"candidate_status">,
    number
  >;
}

export async function getAdminCandidate(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, url, title, note, status, source, score, extracted, candidate_mentions(source, url, title, points, seen_at)",
    )
    .eq("id", id)
    .order("seen_at", { referencedTable: "candidate_mentions", ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}
