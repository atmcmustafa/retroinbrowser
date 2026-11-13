import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/site/listing";
import { findGenre, GenreList, genreMetadata } from "@/components/site/paged-lists";
import { getGenres } from "@/lib/data/taxonomy";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const genres = await getGenres();
  return genres.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const genre = await findGenre((await params).slug);
  if (!genre) return { title: "Genre not found" };
  return genreMetadata(genre, 1);
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
  const genre = await findGenre((await params).slug);
  if (!genre) notFound();
  return <GenreList genre={genre} page={1} />;
}
