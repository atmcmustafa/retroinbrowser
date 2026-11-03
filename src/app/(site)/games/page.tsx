import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/site/catalog-filters";
import { CatalogResults } from "@/components/site/catalog-results";
import { GameGridSkeleton } from "@/components/site/game-grid";
import { PageHeading } from "@/components/site/page-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import { pagedMetadata } from "@/lib/paged-metadata";
import { loadCatalogParams, serializeCatalogParams } from "@/lib/search-params";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Genres = Awaited<ReturnType<typeof getGenres>>;
type Platforms = Awaited<ReturnType<typeof getPlatforms>>;

// Filtered and re-sorted views repeat games from the main list, so only that list gets paged
// canonicals; the views themselves keep pointing at /games.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await loadCatalogParams(searchParams);
  const plain =
    !params.q &&
    !params.genre &&
    !params.platform &&
    !params.mobile &&
    !params.gamepad &&
    !params.nofiles &&
    params.sort === "popular";
  return pagedMetadata({
    title: "All games",
    description: "Search and filter every browser port of a classic game in the directory.",
    path: "/games",
    page: plain ? params.page : 1,
  });
}

export default async function GamesPage({ searchParams }: { searchParams: SearchParams }) {
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
          <Results searchParams={searchParams} genres={genres} platforms={platforms} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({
  searchParams,
  genres,
  platforms,
}: {
  searchParams: SearchParams;
  genres: Genres;
  platforms: Platforms;
}) {
  const params = await loadCatalogParams(searchParams);
  const page = Math.max(1, params.page);
  const genre = genres.find(({ slug }) => slug === params.genre);
  const platform = platforms.find(({ slug }) => slug === params.platform);
  const filtered = Boolean(
    params.q ||
    params.genre ||
    params.platform ||
    params.mobile ||
    params.gamepad ||
    params.nofiles,
  );

  return (
    <CatalogResults
      query={{
        q: params.q,
        genreId: genre?.id ?? null,
        platformId: platform?.id ?? null,
        mobile: params.mobile,
        gamepad: params.gamepad,
        noFiles: params.nofiles,
        sort: params.sort,
        page,
      }}
      hrefFor={(target) => `/games${serializeCatalogParams({ ...params, page: target })}`}
      empty={
        filtered ? (
          <>
            No games match these filters.{" "}
            <Link href="/games" className="rounded-sm text-foreground underline underline-offset-2">
              Clear filters
            </Link>
          </>
        ) : (
          "No games have been published yet."
        )
      }
    />
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
