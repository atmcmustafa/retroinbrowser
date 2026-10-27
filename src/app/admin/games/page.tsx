import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GamesSearch } from "@/components/admin/games-search";
import { GamesTable } from "@/components/admin/games-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getAdminGames } from "@/lib/data/admin";
import { loadAdminGamesParams, serializeAdminGamesParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Games" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const statusFilters = [
  { value: null, label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "hidden", label: "Hidden" },
] as const;

export default async function AdminGamesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const filters = await loadAdminGamesParams(searchParams);
  const games = await getAdminGames(filters);
  const filtered = Boolean(filters.q || filters.status);

  return (
    <>
      <AdminPageHeader
        title="Games"
        description={`${games.length} ${games.length === 1 ? "game" : "games"}`}
        actions={
          <Button asChild>
            <Link href="/admin/games/new">
              <PlusIcon data-icon="inline-start" />
              New game
            </Link>
          </Button>
        }
      />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GamesSearch />
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {statusFilters.map(({ value, label }) => {
            const active = filters.status === value;
            return (
              <Link
                key={label}
                href={`/admin/games${serializeAdminGamesParams({ ...filters, status: value })}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors duration-150",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      {games.length ? (
        <GamesTable games={games} filters={filters} />
      ) : (
        <div className="mt-6 rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-muted-foreground">
            {filtered ? "No games match these filters." : "No games yet."}
          </p>
          {!filtered && (
            <Button asChild className="mt-4">
              <Link href="/admin/games/new">Add the first game</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
