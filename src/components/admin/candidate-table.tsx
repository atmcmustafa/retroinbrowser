"use client";

import { format } from "date-fns";
import { CheckIcon, CopyIcon, ExternalLinkIcon, Undo2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setCandidateStatus, type ReviewStatus } from "@/lib/actions/candidates";
import type { AdminCandidateRow } from "@/lib/data/admin";
import { parseExtracted } from "@/lib/schemas/extraction";
import type { Enums } from "@/types/database";

const sourceLabels: Record<Enums<"candidate_source">, string> = {
  user: "Submission",
  hackernews: "Hacker News",
  reddit: "Reddit",
  github: "GitHub",
  googlenews: "Google News",
};

function ExtractedLine({ candidate }: { candidate: AdminCandidateRow }) {
  const extracted = parseExtracted(candidate.extracted);
  if (!extracted) return null;
  if (!extracted.is_port) {
    return <p className="mt-1 text-xs text-muted-foreground">Not a port: {extracted.reason}</p>;
  }
  const name = [extracted.title, extracted.original_title].filter(Boolean).join(" · ");
  return (
    <p className="mt-1 text-xs">
      {name || "Port"}
      <span className="text-muted-foreground tabular-nums">
        {" "}
        · {Math.round(extracted.confidence * 100)}% sure
      </span>
    </p>
  );
}

const doneLabels: Record<ReviewStatus, string> = {
  rejected: "Rejected",
  duplicate: "Marked as duplicate",
  pending: "Moved back to pending",
};

function displayUrl(url: string) {
  try {
    const { host, pathname, search } = new URL(url);
    const path = pathname === "/" ? "" : pathname;
    return `${host.replace(/^www\./, "")}${path}${search}`;
  } catch {
    return url;
  }
}

export function CandidatesTable({
  candidates,
  status,
}: {
  candidates: AdminCandidateRow[];
  status: Enums<"candidate_status">;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const reviewable = status !== "approved";

  // A status change re-renders the list; only act on rows still on screen.
  const selectedIds = candidates.filter(({ id }) => selected.has(id)).map(({ id }) => id);
  const allState =
    selectedIds.length === 0 ? false : selectedIds.length === candidates.length || "indeterminate";

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function apply(ids: string[], next: ReviewStatus) {
    startTransition(async () => {
      const result = await setCandidateStatus(ids, next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`${doneLabels[next]}: ${result.count}.`);
      setSelected(new Set());
    });
  }

  return (
    <div className="mt-6">
      {reviewable && (
        <div aria-live="polite" className="flex min-h-9 flex-wrap items-center gap-2">
          {selectedIds.length > 0 ? (
            <>
              <span className="mr-1 text-sm tabular-nums">{selectedIds.length} selected</span>
              {status === "pending" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => apply(selectedIds, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => apply(selectedIds, "duplicate")}
                  >
                    Mark duplicate
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => apply(selectedIds, "pending")}
                >
                  Move back to pending
                </Button>
              )}
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
              Select rows to review them together.
            </span>
          )}
        </div>
      )}

      <Table className={reviewable ? "mt-2" : undefined}>
        <TableHeader>
          <TableRow>
            {reviewable && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all candidates"
                  checked={allState}
                  onCheckedChange={(checked) =>
                    setSelected(
                      checked === true ? new Set(candidates.map(({ id }) => id)) : new Set(),
                    )
                  }
                />
              </TableHead>
            )}
            <TableHead>Candidate</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Found</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate.id}
              data-state={selected.has(candidate.id) ? "selected" : undefined}
            >
              {reviewable && (
                <TableCell className="align-top">
                  <Checkbox
                    aria-label={`Select ${candidate.title ?? displayUrl(candidate.url)}`}
                    checked={selected.has(candidate.id)}
                    onCheckedChange={(checked) => toggle(candidate.id, checked === true)}
                  />
                </TableCell>
              )}
              <TableCell className="max-w-96 align-top whitespace-normal">
                <p className={candidate.title ? "font-medium" : "text-muted-foreground italic"}>
                  {candidate.title ?? "Untitled"}
                </p>
                <a
                  href={candidate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">{displayUrl(candidate.url)}</span>
                  <ExternalLinkIcon aria-hidden className="size-3 shrink-0" />
                </a>
                {candidate.note && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    &ldquo;{candidate.note}&rdquo;
                  </p>
                )}
                <ExtractedLine candidate={candidate} />
              </TableCell>
              <TableCell className="align-top">
                {sourceLabels[candidate.source]}
                {candidate.score !== null && (
                  <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                    {candidate.score.toFixed(1)}
                  </span>
                )}
                {(candidate.candidate_mentions[0]?.count ?? 0) > 1 && (
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {candidate.candidate_mentions[0].count} mentions
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right align-top text-muted-foreground tabular-nums">
                {format(new Date(candidate.created_at), "d MMM yyyy")}
              </TableCell>
              <TableCell className="text-right align-top">
                <RowActions candidate={candidate} pending={pending} apply={apply} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RowActions({
  candidate,
  pending,
  apply,
}: {
  candidate: AdminCandidateRow;
  pending: boolean;
  apply: (ids: string[], next: ReviewStatus) => void;
}) {
  if (candidate.status === "approved") {
    return candidate.game ? (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/admin/games/${candidate.game.id}`}>View game</Link>
      </Button>
    ) : null;
  }

  if (candidate.status !== "pending") {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => apply([candidate.id], "pending")}
      >
        <Undo2Icon data-icon="inline-start" />
        Undo
      </Button>
    );
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild size="sm">
        <Link href={`/admin/games/new?candidate=${candidate.id}`}>
          <CheckIcon data-icon="inline-start" />
          Approve
        </Link>
      </Button>
      <Button
        size="icon-sm"
        variant="outline"
        aria-label="Reject"
        title="Reject"
        disabled={pending}
        onClick={() => apply([candidate.id], "rejected")}
      >
        <XIcon />
      </Button>
      <Button
        size="icon-sm"
        variant="outline"
        aria-label="Mark duplicate"
        title="Mark duplicate"
        disabled={pending}
        onClick={() => apply([candidate.id], "duplicate")}
      >
        <CopyIcon />
      </Button>
    </div>
  );
}
