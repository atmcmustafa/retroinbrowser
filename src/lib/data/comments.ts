import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { commentTagKeys, type CommentTag } from "@/lib/comments";
import { createPublicClient } from "@/lib/supabase/server";

export const COMMENTS_PER_PAGE = 5;

const isTag = (tag: string): tag is CommentTag => commentTagKeys.includes(tag as CommentTag);

function cacheComments(gameId: string) {
  cacheTag("comments", `comments:${gameId}`);
  cacheLife("hours");
}

// The total and the tag summary cover every visible comment, not just the page on screen. Only
// the tags column comes back, and PostgREST's row cap (1,000) bounds the summary, not the count.
export async function getCommentStats(gameId: string) {
  "use cache";
  cacheComments(gameId);

  const { data, count, error } = await createPublicClient()
    .from("comments")
    .select("tags", { count: "exact" })
    .eq("game_id", gameId)
    .is("deleted_at", null);
  if (error) throw error;

  const counts = new Map<CommentTag, number>();
  for (const { tags } of data) {
    for (const tag of tags.filter(isTag)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return {
    total: count ?? data.length,
    tagCounts: [...counts].sort((a, b) => b[1] - a[1]),
  };
}

export async function getCommentPage(gameId: string, page: number) {
  "use cache";
  cacheComments(gameId);

  const from = (page - 1) * COMMENTS_PER_PAGE;
  const { data, error } = await createPublicClient()
    .from("comments")
    .select("id, user_id, author_name, body, tags, created_at")
    .eq("game_id", gameId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + COMMENTS_PER_PAGE - 1);
  if (error) throw error;
  return data.map((comment) => ({ ...comment, tags: comment.tags.filter(isTag) }));
}

export type GameComment = Awaited<ReturnType<typeof getCommentPage>>[number];
