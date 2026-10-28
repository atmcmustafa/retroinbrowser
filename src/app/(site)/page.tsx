import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedHero } from "@/components/site/featured-hero";
import { JsonLd } from "@/components/site/json-ld";
import { GameRow } from "@/components/site/game-row";
import { GenreGrid } from "@/components/site/genre-grid";
import { InfoBox } from "@/components/site/info-box";
import { LibraryBox, LibraryBoxSkeleton } from "@/components/site/library-box";
import { PageHeading } from "@/components/site/page-heading";
import { PlatformChips } from "@/components/site/platform-chips";
import {
  getCatalogCounts,
  getFeaturedGames,
  getGamesByGenre,
  getNewGames,
  getPopularGames,
} from "@/lib/data/games";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import { env } from "@/lib/env";
import { siteName } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const ROW_SIZE = 7;

// Lets search engines offer a search box that lands on /games.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: env.NEXT_PUBLIC_SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${new URL("/games", env.NEXT_PUBLIC_SITE_URL).href}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage() {
  const [featured, popular, newest, counts, genres, platforms] = await Promise.all([
    getFeaturedGames(5),
    getPopularGames(ROW_SIZE),
    getNewGames(ROW_SIZE),
    getCatalogCounts(),
    getGenres(),
    getPlatforms(),
  ]);

  const activeGenres = genres
    .map((genre) => ({ ...genre, count: counts.genres[genre.id] ?? 0 }))
    .filter((genre) => genre.count > 0);
  const activePlatforms = platforms
    .map((platform) => ({ ...platform, count: counts.platforms[platform.id] ?? 0 }))
    .filter((platform) => platform.count > 0);
  const genreRows = await Promise.all(
    activeGenres.map(async (genre) => ({
      genre,
      games: await getGamesByGenre(genre.id, ROW_SIZE),
    })),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-10 sm:py-14">
      <JsonLd data={websiteJsonLd} />
      <PageHeading
        title="Classic games, in your browser."
        description="A directory of classic games ported to the web, linking straight to each port."
      />

      {featured.length > 0 && <FeaturedHero games={featured} />}

      {counts.total === 0 ? (
        <p className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
          The catalog is being filled. Check back soon.
        </p>
      ) : (
        <>
          <GenreGrid genres={activeGenres} />
          <GameRow id="row-popular" title="Popular" href="/popular" games={popular} ranked />
          <GameRow id="row-new" title="New" href="/new" games={newest} />
          {genreRows.map(({ genre, games }) => (
            <GameRow
              key={genre.id}
              id={`row-${genre.slug}`}
              title={genre.name}
              href={`/genres/${genre.slug}`}
              games={games}
            />
          ))}
          <PlatformChips platforms={activePlatforms} />
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<LibraryBoxSkeleton />}>
          <LibraryBox />
        </Suspense>
        <InfoBox label="No game files here">
          RetroInBrowser lists browser ports and links to each one&apos;s own site. Some ports need
          files from a copy of the game you own.
        </InfoBox>
      </div>
    </div>
  );
}
