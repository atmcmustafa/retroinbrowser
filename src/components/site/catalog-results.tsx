import Link from "next/link";
import { GameGrid } from "@/components/site/game-grid";
import { Pagination } from "@/components/site/pagination";
import { CATALOG_PAGE_SIZE, searchCatalog, type CatalogQuery } from "@/lib/data/games";

export async function CatalogResults({
  query,
  hrefFor,
  ranked = false,
  empty = "No games here yet.",
}: {
  query: CatalogQuery;
  hrefFor: (page: number) => string;
  ranked?: boolean;
  empty?: React.ReactNode;
}) {
  const { games, total } = await searchCatalog(query);

  if (total === null) {
    return (
      <EmptyState>
        This page is past the end of the list.{" "}
        <Link href={hrefFor(1)} className="rounded-sm text-foreground underline underline-offset-2">
          Go to the first page
        </Link>
        .
      </EmptyState>
    );
  }
  if (games.length === 0) return <EmptyState>{empty}</EmptyState>;

  const totalPages = Math.ceil(total / CATALOG_PAGE_SIZE);
  return (
    <>
      <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
        {total.toLocaleString("en-US")} {total === 1 ? "game" : "games"}
      </p>
      <GameGrid
        games={games}
        rankOffset={ranked ? (query.page - 1) * CATALOG_PAGE_SIZE : undefined}
      />
      <Pagination page={query.page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
      {children}
    </p>
  );
}
