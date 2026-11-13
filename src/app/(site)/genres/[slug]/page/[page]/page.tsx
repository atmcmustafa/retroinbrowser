import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/site/listing";
import { findGenre, GenreList, genreMetadata } from "@/components/site/paged-lists";
import { getCatalogCounts } from "@/lib/data/games";
import { getGenres } from "@/lib/data/taxonomy";
import { pageNumbers, parsePage } from "@/lib/paging";

type Params = Promise<{ slug: string; page: string }>;

export async function generateStaticParams() {
  const [genres, counts] = await Promise.all([getGenres(), getCatalogCounts()]);
  const pages = genres.flatMap(({ id, slug }) =>
    pageNumbers(counts.genres[id] ?? 0).map((page) => ({ slug, page })),
  );
  return pages.length ? pages : [{ slug: "__placeholder__", page: "2" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, page } = await params;
  const genre = await findGenre(slug);
  if (!genre) return { title: "Genre not found" };
  return genreMetadata(genre, parsePage(page));
}

export default function GenrePage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ListingSkeleton />}>
        <Genre params={params} />
      </Suspense>
    </div>
  );
}

async function Genre({ params }: { params: Params }) {
  const { slug, page } = await params;
  const genre = await findGenre(slug);
  if (!genre) notFound();
  return <GenreList genre={genre} page={parsePage(page)} />;
}
