"use client";

import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import type { CommentPage } from "@/app/api/comments/route";
import { CommentForm } from "@/components/site/comment-form";
import { DeleteCommentButton } from "@/components/site/delete-comment-button";
import { Pagination } from "@/components/site/pagination";
import { useSession } from "@/components/site/session-provider";
import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { commentTags } from "@/lib/comments";
import { timeAgo } from "@/lib/time-ago";

const pageParam = parseAsInteger.withDefault(1).withOptions({ history: "push", scroll: false });

// The game page is static; comments come live from /api/comments, and only once the section
// nears the screen, since most visitors press Play and leave.
export function CommentsSection({ gameId, slug }: { gameId: string; slug: string }) {
  const session = useSession();
  const [page, setPage] = useQueryState("comments", pageParam);
  const section = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<CommentPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetch(`/api/comments?game=${gameId}&page=${page}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<CommentPage>) : Promise.reject()))
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, gameId, page, version]);

  const reload = () => setVersion((current) => current + 1);
  const goTo = (target: number) => {
    void setPage(target > 1 ? target : null);
    document.getElementById("comments-list")?.scrollIntoView();
  };
  const user = session.user;

  return (
    <div ref={section}>
      {data && data.tagCounts.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p id="comments-summary" className="text-sm text-muted-foreground">
            Players report
          </p>
          <ul aria-labelledby="comments-summary" className="flex flex-wrap gap-2">
            {data.tagCounts.map(([tag, count]) => (
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
        {session.status === "loading" ? (
          <Skeleton aria-hidden className="h-16 w-full rounded-lg" />
        ) : user ? (
          <CommentForm
            gameId={gameId}
            onPosted={() => {
              // Newest come first, so a comment posted from a later page shows up on the first.
              if (page > 1) goTo(1);
              else reload();
            }}
          />
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
        {failed ? (
          <p className="text-sm text-muted-foreground">
            Comments couldn&apos;t load.{" "}
            <button
              type="button"
              onClick={reload}
              className="rounded-sm text-foreground underline underline-offset-2"
            >
              Try again
            </button>
          </p>
        ) : !data ? (
          <CommentsSkeleton />
        ) : data.total === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {data.total} {data.total === 1 ? "comment" : "comments"}
            </p>
            <ol className="mt-2 divide-y">
              {data.comments.map((comment) => (
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
                  {user && (user.id === comment.user_id || user.isAdmin) && (
                    <DeleteCommentButton id={comment.id} onDeleted={reload} />
                  )}
                </li>
              ))}
            </ol>
            <Pagination
              page={data.page}
              totalPages={data.pages}
              onPage={goTo}
              label="Comment pages"
              className="mt-4"
            />
          </>
        )}
      </div>
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <div aria-hidden className="flex gap-3">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
