import { notFound } from "next/navigation";
import { CatalogResults } from "@/components/site/catalog-results";
import { FilterLink } from "@/components/site/listing";
import { PageHeading } from "@/components/site/page-heading";
import { allGames, searchCatalog, type CatalogQuery } from "@/lib/data/games";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import { GenreIcon } from "@/lib/genre-icons";
import { pagedMetadata, pageHref } from "@/lib/paging";

// Shared by each list's bare page and its /page/N route.

type Genre = Awaited<ReturnType<typeof getGenres>>[number];
type Platform = Awaited<ReturnType<typeof getPlatforms>>[number];

// A page past the end calls notFound() after the shell has streamed, so it answers 200 with
// noindex in <head>, as a missing game does.
async function PagedResults({
  query,
  path,
  ranked,
}: {
  query: CatalogQuery;
  path: string;
  ranked?: boolean;
}) {
  const { total } = await searchCatalog(query);
  if (total === null) notFound();
  return (
    <CatalogResults query={query} hrefFor={(target) => pageHref(path, target)} ranked={ranked} />
  );
}

export function popularMetadata(page: number) {
  return pagedMetadata({
    title: "Popular games",
    description: "The most played browser ports of classic games, ranked by clicks.",
    path: "/popular",
    page,
  });
}

export function PopularList({ page }: { page: number }) {
  return (
    <>
      <PageHeading
        title="Popular"
        description="The most played ports, ranked by how often people hit Play."
      />
      <div className="mt-10">
        <PagedResults query={{ ...allGames, sort: "popular", page }} path="/popular" ranked />
      </div>
    </>
  );
}

export function newMetadata(page: number) {
  return pagedMetadata({
    title: "New games",
    description: "The latest browser ports of classic games added to the directory.",
    path: "/new",
    page,
  });
}

export function NewList({ page }: { page: number }) {
  return (
    <>
      <PageHeading title="New" description="The latest ports added to the directory." />
      <div className="mt-10">
        <PagedResults query={{ ...allGames, sort: "new", page }} path="/new" />
      </div>
    </>
  );
}

export async function findGenre(slug: string) {
  const genres = await getGenres();
  return genres.find((genre) => genre.slug === slug) ?? null;
}

export function genreMetadata(genre: Genre, page: number) {
  return pagedMetadata({
    title: `${genre.name} games in your browser`,
    description: `Classic ${genre.name.toLowerCase()} games ported to run in your browser.`,
    path: `/genres/${genre.slug}`,
    page,
  });
}

export function GenreList({ genre, page }: { genre: Genre; page: number }) {
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
        <PagedResults
          query={{ ...allGames, genreId: genre.id, sort: "popular", page }}
          path={`/genres/${genre.slug}`}
        />
      </div>
    </>
  );
}

export async function findPlatform(slug: string) {
  const platforms = await getPlatforms();
  return platforms.find((platform) => platform.slug === slug) ?? null;
}

export function platformMetadata(platform: Platform, page: number) {
  return pagedMetadata({
    title: `${platform.name} games in your browser`,
    description: `Games first released on ${platform.name}, ported to run in your browser.`,
    path: `/platforms/${platform.slug}`,
    page,
  });
}

export function PlatformList({ platform, page }: { platform: Platform; page: number }) {
  return (
    <>
      <PageHeading
        title={
          <span className="inline-flex items-center gap-4">
            <span
              aria-hidden
              className="size-4 shrink-0 rounded-full sm:size-5"
              style={{ backgroundColor: platform.color }}
            />
            {platform.name}
          </span>
        }
        description={`Games first released on ${platform.name}, ported to run in your browser.`}
      />
      <FilterLink href={`/games?platform=${platform.slug}`} />
      <div className="mt-10">
        <PagedResults
          query={{ ...allGames, platformId: platform.id, sort: "popular", page }}
          path={`/platforms/${platform.slug}`}
        />
      </div>
    </>
  );
}
