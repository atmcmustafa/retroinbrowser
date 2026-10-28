"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { COMMENT_MAX_LENGTH, COMMENT_MAX_TAGS, commentTagKeys } from "@/lib/comments";
import { findCommentProblem } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/server";

export type CommentResult = { ok: true } | { ok: false; message: string };

// Invisible and control characters go first, so a zero-width space can't split a word past
// the filter and a bidi override can't flip how the comment reads.
const cleanBody = (body: string) =>
  body
    .replace(/[\p{Cc}\p{Cf}]/gu, (char) => (char === "\n" ? char : ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const postSchema = z
  .object({
    gameId: z.uuid(),
    body: z
      .string()
      .max(COMMENT_MAX_LENGTH * 2)
      .transform(cleanBody)
      .pipe(z.string().max(COMMENT_MAX_LENGTH, `Keep it under ${COMMENT_MAX_LENGTH} characters.`)),
    tags: z
      .array(z.enum(commentTagKeys))
      .max(COMMENT_MAX_TAGS, `Pick up to ${COMMENT_MAX_TAGS} tags.`)
      .refine((tags) => new Set(tags).size === tags.length)
      .refine((tags) => !(tags.includes("works") && tags.includes("not_working")), {
        error: "Pick either Works or Doesn't work.",
      }),
  })
  // Counted by code point like the database's char_length, so one emoji is one character.
  .refine(({ body, tags }) => [...body].length >= 2 || tags.length > 0, {
    error: "Write a comment or pick a tag.",
  });

const problemMessages = {
  link: "Links aren't allowed in comments.",
  profanity: "Your comment has words we don't allow. Please rephrase it.",
};

// Signed-in users can't write to the comments table (see the comments_open migration), so the
// checks here can't be skipped by calling the database directly. Both actions write with the
// secret key after checking who is asking.
export async function postComment(input: {
  gameId: string;
  body: string;
  tags: string[];
}): Promise<CommentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to comment." };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your comment." };
  }
  const { gameId, body, tags } = parsed.data;

  const problem = findCommentProblem(body);
  if (problem) return { ok: false, message: problemMessages[problem] };

  const admin = createAdminClient();
  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("status", "published")
    .maybeSingle();
  if (gameError) console.error("Looking up the game failed", gameError);
  if (!game) return { ok: false, message: "This game isn't open for comments." };

  // Usernames are chosen freely, so they pass the same filter before showing up publicly.
  const authorName = findCommentProblem(user.publicName) ? "Player" : user.publicName;
  const { error } = await admin
    .from("comments")
    .insert({ game_id: gameId, user_id: user.id, author_name: authorName, body, tags });
  if (error) {
    if (error.code === "P0001" && error.hint === "rate_limited") {
      return { ok: false, message: "You're commenting too fast. Try again in a few minutes." };
    }
    if (error.code === "23514") {
      return { ok: false, message: "Write at least two characters or pick a tag." };
    }
    console.error("Posting a comment failed", error);
    return { ok: false, message: "Couldn't post your comment. Try again." };
  }

  updateTag(`comments:${gameId}`);
  return { ok: true };
}

export async function deleteComment(id: string): Promise<CommentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to delete your comment." };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown comment." };

  const admin = createAdminClient();
  const { data: comment, error } = await admin
    .from("comments")
    .select("user_id, game_id")
    .eq("id", parsed.data)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) console.error("Looking up the comment failed", error);
  if (!comment || (comment.user_id !== user.id && user.role !== "admin")) {
    return { ok: false, message: "That comment is already gone." };
  }

  let update = admin
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .is("deleted_at", null);
  if (user.role !== "admin") update = update.eq("user_id", user.id);
  const { error: deleteError } = await update;
  if (deleteError) {
    console.error("Deleting a comment failed", deleteError);
    return { ok: false, message: "Couldn't delete the comment. Try again." };
  }

  updateTag(`comments:${comment.game_id}`);
  return { ok: true };
}
