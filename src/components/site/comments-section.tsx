import Link from "next/link";
import { CommentForm } from "@/components/site/comment-form";
import { DeleteCommentButton } from "@/components/site/delete-comment-button";
import { Pagination } from "@/components/site/pagination";
import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { commentTags } from "@/lib/comments";
import { COMMENTS_PER_PAGE, getCommentPage, getCommentStats } from "@/lib/data/comments";
import { loadCommentPageParams } from "@/lib/search-params";
import { timeAgo } from "@/lib/time-ago";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Streams in after the cached page: the lists are cached per game, the form depends on who's
// asking. The session is read first on purpose: it ends the prerender before any list is
// fetched, so none gets baked into the static shell, where a stale copy outlived updateTag.
export async function CommentsSection({
  gameId,
  slug,
  searchParams,
}: {
  gameId: string;
  slug: string;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  const { comments: requested } = await loadCommentPageParams(searchParams);
  const { total, tagCounts } = await getCommentStats(gameId);
  const pages = Math.max(1, Math.ceil(total / COMMENTS_PER_PAGE));
  const page = Math.min(Math.max(1, requested), pages);
  const comments = total ? await getCommentPage(gameId, page) : [];
  const hrefFor = (target: number) =>
    `/games/${slug}${target > 1 ? `?comments=${target}` : ""}#comments-list`;

  return (
    <>
      {tagCounts.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p id="comments-summary" className="text-sm text-muted-foreground">
            Players report
          </p>
          <ul aria-labelledby="comments-summary" className="flex flex-wrap gap-2">
            {tagCounts.map(([tag, count]) => (
              <li
                key={tag}
                className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-sm"
              >
                {commentTags[tag]}
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        {user ? (
          <CommentForm gameId={gameId} slug={slug} page={page} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4 text-sm">
            <p>Sign in to say how this port runs for you.</p>
            <Button asChild variant="outline">
              <Link href={`/login?next=${encodeURIComponent(`/games/${slug}#comments`)}`}>
                Sign in
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div id="comments-list" className="mt-8 scroll-mt-6">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {total} {total === 1 ? "comment" : "comments"}
            </p>
            <ol className="mt-2 divide-y">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3 py-5">
                  <UserAvatar name={comment.author_name} src={null} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold break-words">{comment.author_name}</span>
                      <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
                        {timeAgo(comment.created_at)}
                      </time>
                    </p>
                    {comment.tags.length > 0 && (
                      <ul aria-label="Tags" className="mt-2 flex flex-wrap gap-1.5">
                        {comment.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {commentTags[tag]}
                          </li>
                        ))}
                      </ul>
                    )}
                    {comment.body && (
                      <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line">
                        {comment.body}
                      </p>
                    )}
                  </div>
                  {user && (user.id === comment.user_id || user.role === "admin") && (
                    <DeleteCommentButton id={comment.id} />
                  )}
                </li>
              ))}
            </ol>
            <Pagination
              page={page}
              totalPages={pages}
              hrefFor={hrefFor}
              label="Comment pages"
              className="mt-4"
            />
          </>
        )}
      </div>
    </>
  );
}

export function CommentsSkeleton() {
  return (
    <div aria-hidden className="mt-6 flex flex-col gap-6">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
