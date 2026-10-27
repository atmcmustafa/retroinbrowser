import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogResults } from "@/components/site/catalog-results";
import { FilterLink, ListingSkeleton } from "@/components/site/listing";
import { PageHeading } from "@/components/site/page-heading";
import { allGames } from "@/lib/data/games";
import { getGenres } from "@/lib/data/taxonomy";
import { GenreIcon } from "@/lib/genre-icons";
import { loadPageParams } from "@/lib/search-params";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function findGenre(slug: string) {
  const genres = await getGenres();
  return genres.find((genre) => genre.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const genres = await getGenres();
  return genres.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const genre = await findGenre((await params).slug);
  if (!genre) return { title: "Genre not found" };
  return {
    title: `${genre.name} games in your browser`,
    description: `Classic ${genre.name.toLowerCase()} games ported to run in your browser.`,
    alternates: { canonical: `/genres/${genre.slug}` },
  };
}

export default function GenrePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ListingSkeleton />}>
        <Genre params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Genre({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const genre = await findGenre((await params).slug);
  if (!genre) notFound();
  const { page } = await loadPageParams(searchParams);
  const path = `/genres/${genre.slug}`;

  return (
    <>
      <PageHeading
        title={
          <span className="inline-flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg border bg-surface sm:size-14">
              <GenreIcon icon={genre.icon} aria-hidden className="size-6 text-primary" />
            </span>
            {genre.name}
          </span>
        }
        description={`Classic ${genre.name.toLowerCase()} games ported to the browser.`}
      />
      <FilterLink href={`/games?genre=${genre.slug}`} />
      <div className="mt-10">
        <CatalogResults
          query={{ ...allGames, genreId: genre.id, sort: "popular", page: Math.max(1, page) }}
          hrefFor={(target) => (target > 1 ? `${path}?page=${target}` : path)}
        />
      </div>
    </>
  );
}
