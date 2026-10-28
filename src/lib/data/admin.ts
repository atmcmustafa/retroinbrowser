import "server-only";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { toSearchTerm } from "@/lib/search";
import type {
  AdminCommentsFilters,
  AdminGamesFilters,
  AdminUsersFilters,
} from "@/lib/search-params";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Constants, type Enums } from "@/types/database";

type CountResult = { count: number | null; error: unknown };

function countOf({ count, error }: CountResult) {
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminStats() {
  const supabase = await createClient();
  const games = () => supabase.from("games").select("id", { count: "exact", head: true });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [published, drafts, pending, broken, users, comments] = await Promise.all([
    games().eq("status", "published"),
    games().eq("status", "draft"),
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    games().eq("status", "published").eq("link_status", "broken"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", weekAgo),
  ]);

  return {
    published: countOf(published),
    drafts: countOf(drafts),
    pending: countOf(pending),
    broken: countOf(broken),
    users: countOf(users),
    comments: countOf(comments),
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

export const ADMIN_COMMENTS_PER_PAGE = 25;

const isUuid = (value: string | null): value is string => z.uuid().safeParse(value).success;

// RLS shows deleted comments to admins only, so they can be restored from here.
export async function getAdminComments({ q, status, user, game, page }: AdminCommentsFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("comments")
    .select(
      "id, user_id, author_name, body, tags, created_at, deleted_at, deleted_by, game:games(id, slug, title), author:profiles(username, banned_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id");

  if (status === "visible") query = query.is("deleted_at", null);
  if (status === "deleted") query = query.not("deleted_at", "is", null);
  if (isUuid(user)) query = query.eq("user_id", user);
  if (isUuid(game)) query = query.eq("game_id", game);
  const term = toSearchTerm(q);
  if (term) query = query.or(`body.ilike."%${term}%",author_name.ilike."%${term}%"`);

  const from = (Math.max(1, page) - 1) * ADMIN_COMMENTS_PER_PAGE;
  const { data, count, error } = await query.range(from, from + ADMIN_COMMENTS_PER_PAGE - 1);
  // Past the last page PostgREST answers 416; the page shows the way back instead.
  if (error?.code === "PGRST103") return { comments: [], total: count ?? 0 };
  if (error) throw error;
  return { comments: data, total: count ?? data.length };
}

export type AdminCommentRow = Awaited<ReturnType<typeof getAdminComments>>["comments"][number];

export const ADMIN_USERS_PER_PAGE = 50;

function metaText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function allProfiles(admin: ReturnType<typeof createAdminClient>) {
  const profiles = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, username, role, banned_at, ban_reason, comments(count)")
      .is("comments.deleted_at", null)
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    profiles.push(...data);
    if (data.length < 1000) return profiles;
  }
}

// Emails and sign-in times live in auth.users, which only the secret key can read, so this checks
// for an admin itself. Both lists come in pages of 1,000 (PostgREST's row cap); filtering and
// paging happen here.
export async function getAdminUsers({ q, status, page }: AdminUsersFilters) {
  await requireAdmin();
  const admin = createAdminClient();
  const accounts: User[] = [];
  for (let next = 1; ; next++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: next, perPage: 1000 });
    if (error) throw error;
    accounts.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const profileOf = new Map((await allProfiles(admin)).map((profile) => [profile.id, profile]));
  const now = Date.now();

  const all = accounts
    .map((account) => {
      const profile = profileOf.get(account.id);
      const fullName =
        metaText(account.user_metadata?.full_name) ?? metaText(account.user_metadata?.name);
      return {
        id: account.id,
        email: account.email ?? null,
        username: profile?.username ?? null,
        fullName,
        role: profile?.role ?? "user",
        bannedAt: profile?.banned_at ?? null,
        banReason: profile?.ban_reason ?? null,
        // False after a ban whose Auth step failed: the site blocks them, sign-in still works.
        authBanned: Boolean(account.banned_until && Date.parse(account.banned_until) > now),
        comments: profile?.comments[0]?.count ?? 0,
        providers: (account.app_metadata?.providers as string[] | undefined) ?? [],
        createdAt: account.created_at,
        lastSignInAt: account.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const term = q.trim().toLowerCase();
  const filtered = all.filter(
    (user) =>
      (!term ||
        [user.email, user.username, user.fullName].some((value) =>
          value?.toLowerCase().includes(term),
        )) &&
      (status !== "banned" || user.bannedAt !== null) &&
      (status !== "admins" || user.role === "admin"),
  );

  const from = (Math.max(1, page) - 1) * ADMIN_USERS_PER_PAGE;
  return {
    users: filtered.slice(from, from + ADMIN_USERS_PER_PAGE),
    total: filtered.length,
    counts: {
      all: all.length,
      banned: all.filter((user) => user.bannedAt).length,
      admins: all.filter((user) => user.role === "admin").length,
    },
  };
}

export type AdminUserRow = Awaited<ReturnType<typeof getAdminUsers>>["users"][number];

// The latest weekly screenshot per published game (scripts/smoke.ts).
export async function getSmokeChecks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, slug, title, play_url, link_checks(checked_at, verdict, http_status, error, details)",
    )
    .eq("status", "published")
    .eq("link_checks.kind", "smoke")
    .order("title")
    .order("checked_at", { referencedTable: "link_checks", ascending: false })
    .limit(1, { referencedTable: "link_checks" });
  if (error) throw error;
  return data;
}

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
