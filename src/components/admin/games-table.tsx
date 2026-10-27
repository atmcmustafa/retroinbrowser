"use client";

import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { setGamesStatus } from "@/lib/actions/games";
import type { AdminGameRow } from "@/lib/data/admin";
import { gameStatusLabels } from "@/lib/schemas/game";
import {
  serializeAdminGamesParams,
  type AdminGamesFilters,
  type adminGameSorts,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

type Status = Enums<"game_status">;

const statusDot: Record<Status, string> = {
  published: "bg-primary",
  draft: "bg-muted-foreground",
  hidden: "border border-muted-foreground",
};

const bulkActions: { status: Status; label: string; done: string }[] = [
  { status: "published", label: "Publish", done: "Published" },
  { status: "draft", label: "Move to draft", done: "Moved to draft" },
  { status: "hidden", label: "Hide", done: "Hidden" },
];

export function GamesTable({
  games,
  filters,
}: {
  games: AdminGameRow[];
  filters: AdminGamesFilters;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // A filter change can hide selected rows; only act on the ones on screen.
  const selectedIds = games.filter(({ id }) => selected.has(id)).map(({ id }) => id);
  const allState =
    selectedIds.length === 0 ? false : selectedIds.length === games.length || "indeterminate";

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function apply({ status, done }: (typeof bulkActions)[number]) {
    startTransition(async () => {
      const result = await setGamesStatus(selectedIds, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`${done}: ${result.count} ${result.count === 1 ? "game" : "games"}.`);
      setSelected(new Set());
    });
  }

  return (
    <div className="mt-6">
      <div aria-live="polite" className="flex min-h-9 flex-wrap items-center gap-2">
        {selectedIds.length > 0 ? (
          <>
            <span className="mr-1 text-sm tabular-nums">{selectedIds.length} selected</span>
            {bulkActions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.status === "published" ? "default" : "outline"}
                disabled={pending}
                onClick={() => apply(action)}
              >
                {action.label}
              </Button>
            ))}
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
            Select games to publish, unpublish or hide them together.
          </span>
        )}
      </div>

      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label="Select all games"
                checked={allState}
                onCheckedChange={(checked) =>
                  setSelected(checked === true ? new Set(games.map(({ id }) => id)) : new Set())
                }
              />
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Cover</span>
            </TableHead>
            <SortableHead filters={filters} sort="title">
              Game
            </SortableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <SortableHead filters={filters} sort="clicks" className="text-right">
              Clicks
            </SortableHead>
            <SortableHead filters={filters} sort="updated" className="text-right">
              Updated
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id} data-state={selected.has(game.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  aria-label={`Select ${game.title}`}
                  checked={selected.has(game.id)}
                  onCheckedChange={(checked) => toggle(game.id, checked === true)}
                />
              </TableCell>
              <TableCell>
                {game.cover_url ? (
                  <Image
                    src={game.cover_url}
                    alt=""
                    width={32}
                    height={48}
                    unoptimized
                    className="h-12 w-8 rounded-sm object-cover"
                  />
                ) : (
                  <div className="h-12 w-8 rounded-sm bg-surface-hover" />
                )}
              </TableCell>
              <TableCell className="max-w-72">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="truncate rounded-sm font-medium hover:underline"
                  >
                    {game.title}
                  </Link>
                  {game.featured && (
                    <StarIcon aria-label="Featured" className="size-3.5 shrink-0 text-primary" />
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{game.original_title}</div>
              </TableCell>
              <TableCell>
                {game.platform && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: game.platform.color }}
                    />
                    {game.platform.name}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className={cn("size-2 rounded-full", statusDot[game.status])} />
                  {gameStatusLabels[game.status]}
                </span>
                {game.link_status === "broken" && (
                  <Badge variant="destructive" className="ml-2">
                    Broken link
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {game.click_count.toLocaleString("en-US")}
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {format(new Date(game.updated_at), "d MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SortableHead({
  filters,
  sort,
  className,
  children,
}: {
  filters: AdminGamesFilters;
  sort: (typeof adminGameSorts)[number];
  className?: string;
  children: React.ReactNode;
}) {
  const active = filters.sort === sort;
  const ascending = sort === "title";
  const Arrow = ascending ? ArrowUpIcon : ArrowDownIcon;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (ascending ? "ascending" : "descending") : undefined}
    >
      <Link
        href={`/admin/games${serializeAdminGamesParams({ ...filters, sort })}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm transition-colors duration-150 hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        {active && <Arrow aria-hidden className="size-3.5" />}
      </Link>
    </TableHead>
  );
}
