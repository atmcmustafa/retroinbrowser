"use client";

import { ExternalLinkIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { setCommentsDeleted } from "@/lib/actions/comments";
import { cn } from "@/lib/utils";

export type ModerationComment = {
  id: string;
  userId: string;
  authorName: string;
  authorBanned: boolean;
  body: string;
  tags: string[];
  createdAt: string;
  ago: string;
  deletedBy: "author" | "admin" | null;
  game: { id: string; slug: string; title: string } | null;
};

// Deleting takes one click and the toast offers Undo; deletes are soft, so Restore works later too.
export function CommentModeration({ comments }: { comments: ModerationComment[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // A filter or page change can hide selected rows; only act on the ones on screen.
  const selectedIds = comments.filter(({ id }) => selected.has(id)).map(({ id }) => id);
  const allState =
    selectedIds.length === 0 ? false : selectedIds.length === comments.length || "indeterminate";

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function apply(ids: string[], deleted: boolean) {
    startTransition(async () => {
      const result = await setCommentsDeleted(ids, deleted);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSelected(new Set());
      const changed = result.ids;
      if (changed.length === 0) {
        toast(deleted ? "Those comments were already deleted." : "Nothing to restore here.");
        return;
      }
      const noun = changed.length === 1 ? "comment" : "comments";
      toast.success(`${deleted ? "Deleted" : "Restored"} ${changed.length} ${noun}.`, {
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              const undo = await setCommentsDeleted(changed, !deleted);
              if (!undo.ok) toast.error(undo.message);
            }),
        },
      });
    });
  }

  return (
    <div className="mt-6">
      <div aria-live="polite" className="flex min-h-9 flex-wrap items-center gap-2">
        <Checkbox
          aria-label="Select all comments on this page"
          checked={allState}
          onCheckedChange={(checked) =>
            setSelected(checked === true ? new Set(comments.map(({ id }) => id)) : new Set())
          }
          className="mr-1"
        />
        {selectedIds.length > 0 ? (
          <>
            <span className="mr-1 text-sm tabular-nums">{selectedIds.length} selected</span>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => apply(selectedIds, true)}
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => apply(selectedIds, false)}
            >
              Restore
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Select comments to delete or restore them together.
          </span>
        )}
      </div>

      <ul className="mt-2 divide-y rounded-lg border">
        {comments.map((comment) => (
          <li
            key={comment.id}
            data-state={selected.has(comment.id) ? "selected" : undefined}
            className={cn(
              "flex gap-3 p-4 data-[state=selected]:bg-surface",
              comment.deletedBy && "text-muted-foreground",
            )}
          >
            <Checkbox
              aria-label={`Select the comment by ${comment.authorName}`}
              checked={selected.has(comment.id)}
              onCheckedChange={(checked) => toggle(comment.id, checked === true)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link
                  href={`/admin/comments?user=${comment.userId}`}
                  className="rounded-sm font-semibold break-words hover:underline"
                >
                  {comment.authorName}
                </Link>
                {comment.authorBanned && <Badge variant="destructive">Banned</Badge>}
                {comment.game && (
                  <span className="inline-flex items-baseline gap-1 text-muted-foreground">
                    on
                    <Link
                      href={`/admin/comments?game=${comment.game.id}`}
                      className="rounded-sm hover:text-foreground hover:underline"
                    >
                      {comment.game.title}
                    </Link>
                    <a
                      href={`/games/${comment.game.slug}#comments`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${comment.game.title}`}
                      className="rounded-sm hover:text-foreground"
                    >
                      <ExternalLinkIcon aria-hidden className="size-3" />
                    </a>
                  </span>
                )}
                <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                  {comment.ago}
                </time>
                {comment.deletedBy && (
                  <Badge variant="outline">
                    {comment.deletedBy === "author" ? "Deleted by author" : "Deleted"}
                  </Badge>
                )}
              </p>
              {comment.tags.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">{comment.tags.join(" · ")}</p>
              )}
              {comment.body && (
                <p className="mt-1.5 break-words whitespace-pre-line">{comment.body}</p>
              )}
            </div>
            {comment.deletedBy === "author" ? (
              // The author took it down; an admin doesn't put it back.
              <span className="size-7 shrink-0" />
            ) : comment.deletedBy === "admin" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Restore comment"
                disabled={pending}
                onClick={() => apply([comment.id], false)}
              >
                <RotateCcwIcon />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Delete comment"
                disabled={pending}
                onClick={() => apply([comment.id], true)}
              >
                <Trash2Icon />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
