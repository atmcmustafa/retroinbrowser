import { XIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminSearch } from "@/components/admin/admin-search";
import { CommentModeration } from "@/components/admin/comment-moderation";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/site/pagination";
import { requireAdmin } from "@/lib/auth";
import { commentTags, type CommentTag } from "@/lib/comments";
import { ADMIN_COMMENTS_PER_PAGE, getAdminComments } from "@/lib/data/admin";
import {
  loadAdminCommentsParams,
  serializeAdminCommentsParams,
  type AdminCommentsFilters,
} from "@/lib/search-params";
import { timeAgo } from "@/lib/time-ago";

export const metadata: Metadata = { title: "Comments" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const statusTabs: { value: AdminCommentsFilters["status"]; label: string }[] = [
  { value: null, label: "All" },
  { value: "visible", label: "Visible" },
  { value: "deleted", label: "Deleted" },
];

export default async function AdminCommentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const filters = await loadAdminCommentsParams(searchParams);
  const { comments, total } = await getAdminComments(filters);
  const pages = Math.max(1, Math.ceil(total / ADMIN_COMMENTS_PER_PAGE));
  const href = (changes: { [K in keyof AdminCommentsFilters]?: AdminCommentsFilters[K] | null }) =>
    `/admin/comments${serializeAdminCommentsParams({ ...filters, page: null, ...changes })}`;

  // Filter chips name the author or game from the rows they matched.
  const first = comments[0];
  const scopes = [
    filters.user && {
      label: `By ${first?.author_name ?? "this user"}`,
      clear: href({ user: null }),
    },
    filters.game && {
      label: `On ${first?.game?.title ?? "this game"}`,
      clear: href({ game: null }),
    },
  ].filter(Boolean) as { label: string; clear: string }[];

  return (
    <>
      <AdminPageHeader
        title="Comments"
        description={`${total} ${total === 1 ? "comment" : "comments"}, newest first. Links and insults never get this far.`}
      />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch label="Search comments" placeholder="Text or author" />
        <FilterTabs
          label="Filter by status"
          tabs={statusTabs.map(({ value, label }) => ({
            label,
            href: href({ status: value }),
            active: filters.status === value,
          }))}
        />
      </div>
      {scopes.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {scopes.map((scope) => (
            <li key={scope.label}>
              <Link
                href={scope.clear}
                className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-sm transition-colors duration-150 hover:bg-surface-hover"
              >
                {scope.label}
                <XIcon aria-label="Remove filter" className="size-3.5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {comments.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
          {total > 0 ? (
            <Link href={href({ page: null })} className="rounded-sm underline underline-offset-2">
              Back to the first page
            </Link>
          ) : (
            "No comments match."
          )}
        </div>
      ) : (
        <CommentModeration
          comments={comments.map((comment) => ({
            id: comment.id,
            userId: comment.user_id,
            authorName: comment.author_name,
            authorBanned: Boolean(comment.author?.banned_at),
            body: comment.body,
            tags: comment.tags.map((tag) => commentTags[tag as CommentTag] ?? tag),
            createdAt: comment.created_at,
            ago: timeAgo(comment.created_at),
            deletedBy:
              comment.deleted_at === null
                ? null
                : comment.deleted_by === "author"
                  ? "author"
                  : "admin",
            game: comment.game,
          }))}
        />
      )}
      <Pagination
        page={Math.min(Math.max(1, filters.page), pages)}
        totalPages={pages}
        hrefFor={(page) => href({ page: page > 1 ? page : null })}
        className="mt-8"
      />
    </>
  );
}
