"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postComment } from "@/lib/actions/comments";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_MAX_TAGS,
  commentTagKeys,
  commentTags,
  toggleTag,
  type CommentTag,
} from "@/lib/comments";
import { cn } from "@/lib/utils";

export function CommentForm({ gameId }: { gameId: string }) {
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<CommentTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const full = tags.length >= COMMENT_MAX_TAGS;
  const empty = [...body.trim()].length < 2 && tags.length === 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await postComment({ gameId, body, tags });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setBody("");
      setTags([]);
      setError(null);
      toast.success("Comment posted.");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-sm font-medium">
          How does it run?{" "}
          <span className="font-normal text-muted-foreground">Pick up to {COMMENT_MAX_TAGS}.</span>
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {commentTagKeys.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                disabled={!selected && full}
                onClick={() => setTags((current) => toggleTag(current, tag))}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground enabled:hover:bg-surface-hover enabled:hover:text-foreground",
                )}
              >
                {commentTags[tag]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="comment-body" className="sr-only">
          Comment
        </label>
        <Textarea
          id="comment-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={COMMENT_MAX_LENGTH}
          rows={3}
          placeholder="Your browser or device, and what worked or didn't"
          aria-describedby="comment-hint"
          aria-invalid={Boolean(error) || undefined}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p id="comment-hint" className="text-xs text-muted-foreground">
            No links or insults.{" "}
            <span className="tabular-nums">
              {body.length}/{COMMENT_MAX_LENGTH}
            </span>
          </p>
          <Button type="submit" disabled={pending || empty}>
            {pending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </div>

      <p role="alert" className="text-sm text-destructive empty:hidden">
        {error}
      </p>
    </form>
  );
}
