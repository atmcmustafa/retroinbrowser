import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { commentTagKeys, type CommentTag } from "@/lib/comments";
import { createPublicClient } from "@/lib/supabase/server";

export const COMMENTS_SHOWN = 100;

export async function getComments(gameId: string) {
  "use cache";
  cacheTag("comments", `comments:${gameId}`);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("comments")
    .select("id, user_id, author_name, body, tags, created_at")
    .eq("game_id", gameId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(COMMENTS_SHOWN);
  if (error) throw error;
  return data.map((comment) => ({
    ...comment,
    tags: comment.tags.filter((tag): tag is CommentTag =>
      commentTagKeys.includes(tag as CommentTag),
    ),
  }));
}

export type GameComment = Awaited<ReturnType<typeof getComments>>[number];
