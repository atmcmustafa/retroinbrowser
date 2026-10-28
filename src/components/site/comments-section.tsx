import Link from "next/link";
import { CommentForm } from "@/components/site/comment-form";
import { DeleteCommentButton } from "@/components/site/delete-comment-button";
import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { commentTags, type CommentTag } from "@/lib/comments";
import { COMMENTS_SHOWN, getComments, type GameComment } from "@/lib/data/comments";
import { timeAgo } from "@/lib/time-ago";

function tagCounts(comments: GameComment[]) {
  const counts = new Map<CommentTag, number>();
  for (const { tags } of comments) {
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

// Streams in after the cached page: the list is cached per game, the form depends on who's asking.
// The session is read first on purpose: it ends the prerender before the list is fetched, so the
// list never gets baked into the static shell, where a stale copy outlived updateTag.
export async function CommentsSection({ gameId, slug }: { gameId: string; slug: string }) {
  const user = await getCurrentUser();
  const comments = await getComments(gameId);
  const counts = tagCounts(comments);

  return (
    <>
      {counts.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p id="comments-summary" className="text-sm text-muted-foreground">
            Players report
          </p>
          <ul aria-labelledby="comments-summary" className="flex flex-wrap gap-2">
            {counts.map(([tag, count]) => (
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
          <CommentForm gameId={gameId} />
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

      {comments.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ol className="mt-8 divide-y">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 py-5 first:pt-0">
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
      )}
      {comments.length === COMMENTS_SHOWN && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the latest {COMMENTS_SHOWN} comments.
        </p>
      )}
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
