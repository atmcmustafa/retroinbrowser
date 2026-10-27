import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminGameRow } from "@/lib/data/admin";
import { gameStatusLabels } from "@/lib/schemas/game";
import {
  serializeAdminGamesParams,
  type AdminGamesFilters,
  type adminGameSorts,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const statusDot: Record<Enums<"game_status">, string> = {
  published: "bg-primary",
  draft: "bg-muted-foreground",
  hidden: "border border-muted-foreground",
};

export function GamesTable({
  games,
  filters,
}: {
  games: AdminGameRow[];
  filters: AdminGamesFilters;
}) {
  return (
    <Table className="mt-6">
      <TableHeader>
        <TableRow>
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
          <TableRow key={game.id}>
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
