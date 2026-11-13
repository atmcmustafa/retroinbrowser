import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/site/catalog-browser";
import { CatalogFilters } from "@/components/site/catalog-filters";
import { GameGridSkeleton } from "@/components/site/game-grid";
import { PageHeading } from "@/components/site/page-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";

// Every view of the search page (filtered, re-sorted, paged) points at /games, so its metadata
// stays static. The same lists are crawlable with their own canonicals under /popular/page/N,
// /new, /genres and /platforms. Results are filtered in the browser, so the page is static too.
export const metadata: Metadata = {
  title: "All games",
  description: "Search and filter every browser port of a classic game in the directory.",
  alternates: { canonical: "/games" },
};

export default async function GamesPage() {
  const [genres, platforms] = await Promise.all([getGenres(), getPlatforms()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeading
        title="All games"
        description="Every port in the directory. Search by name or narrow it down."
      />
      <div className="mt-8">
        <Suspense fallback={<FiltersSkeleton />}>
          <CatalogFilters genres={genres} platforms={platforms} />
        </Suspense>
      </div>
      <div className="mt-8">
        <Suspense fallback={<GameGridSkeleton />}>
          <CatalogBrowser genres={genres} />
        </Suspense>
      </div>
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-2/3" />
    </div>
  );
}
