import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteCommentButton } from "@/components/site/delete-comment-button";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { commentTags, type CommentTag } from "@/lib/comments";
import { getAdminComments } from "@/lib/data/admin";
import { timeAgo } from "@/lib/time-ago";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Comments" };

export default async function AdminCommentsPage() {
  await requireAdmin();
  const comments = await getAdminComments();

  return (
    <>
      <AdminPageHeader
        title="Comments"
        description="The latest 200, newest first. Links and insults never get this far."
      />
      {comments.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn("flex gap-3 p-4", comment.deleted_at && "text-muted-foreground")}
            >
              <div className="min-w-0 flex-1 text-sm">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-semibold break-words">{comment.author_name}</span>
                  {comment.game && (
                    <Link
                      href={`/games/${comment.game.slug}#comments`}
                      className="rounded-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      on {comment.game.title}
                    </Link>
                  )}
                  <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </time>
                  {comment.deleted_at && <Badge variant="outline">Deleted</Badge>}
                </p>
                {comment.tags.length > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {comment.tags.map((tag) => commentTags[tag as CommentTag] ?? tag).join(" · ")}
                  </p>
                )}
                {comment.body && (
                  <p className="mt-1.5 break-words whitespace-pre-line">{comment.body}</p>
                )}
              </div>
              {!comment.deleted_at && <DeleteCommentButton id={comment.id} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
