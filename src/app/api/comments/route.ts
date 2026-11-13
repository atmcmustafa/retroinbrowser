import type { NextRequest } from "next/server";
import { z } from "zod";
import type { CommentTag } from "@/lib/comments";
import {
  COMMENTS_PER_PAGE,
  getCommentPage,
  getCommentStats,
  type GameComment,
} from "@/lib/data/comments";

export type CommentPage = {
  total: number;
  tagCounts: [CommentTag, number][];
  page: number;
  pages: number;
  comments: GameComment[];
};

const querySchema = z.object({
  game: z.uuid(),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return Response.json({ error: "Unknown game." }, { status: 400 });

  const { game, page: requested } = parsed.data;
  const { total, tagCounts } = await getCommentStats(game);
  const pages = Math.max(1, Math.ceil(total / COMMENTS_PER_PAGE));
  const page = Math.min(requested, pages);
  const body: CommentPage = {
    total,
    tagCounts,
    page,
    pages,
    comments: total ? await getCommentPage(game, page) : [],
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
