import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogResults } from "@/components/site/catalog-results";
import { GameGridSkeleton } from "@/components/site/game-grid";
import { PageHeading } from "@/components/site/page-heading";
import { allGames } from "@/lib/data/games";
import { loadPageParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Popular games",
  description: "The most played browser ports of classic games, ranked by clicks.",
  alternates: { canonical: "/popular" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function PopularPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeading
        title="Popular"
        description="The most played ports, ranked by how often people hit Play."
      />
      <div className="mt-10">
        <Suspense fallback={<GameGridSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { page } = await loadPageParams(searchParams);
  return (
    <CatalogResults
      query={{ ...allGames, sort: "popular", page: Math.max(1, page) }}
      hrefFor={(target) => (target > 1 ? `/popular?page=${target}` : "/popular")}
      ranked
    />
  );
}
