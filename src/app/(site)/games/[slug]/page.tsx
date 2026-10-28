import { format } from "date-fns";
import { CodeIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommentsSection, CommentsSkeleton } from "@/components/site/comments-section";
import { FavoriteControl, FavoriteControlSkeleton } from "@/components/site/favorite-control";
import { badgesFor } from "@/components/site/game-badges";
import { GameRow } from "@/components/site/game-row";
import { InfoBox } from "@/components/site/info-box";
import { JsonLd } from "@/components/site/json-ld";
import { RichText } from "@/components/site/rich-text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getGameBySlug, getPublishedSlugs, getSimilarGames } from "@/lib/data/games";
import { env } from "@/lib/env";
import { originalPlatform } from "@/lib/platform-name";
import { baseOpenGraph } from "@/lib/site";
import { cn } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  // Cache Components rejects an empty list at build time; the placeholder resolves to notFound().
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };

  const title = `Play ${game.original_title} in your browser: ${game.title}`;
  const description =
    game.summary ?? `Play ${game.original_title} in your browser with ${game.title}.`;
  return {
    title,
    description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: { ...baseOpenGraph, title, description, url: `/games/${game.slug}` },
  };
}

export default function GamePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <GameDetail params={params} />
    </Suspense>
  );
}

async function GameDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const similar = await getSimilarGames(
    game.id,
    game.genres.map(({ id }) => id),
    game.platform_id,
    7,
  );
  const badges = badgesFor(game);
  const host = new URL(game.play_url).hostname.replace(/^www\./, "");
  const absolute = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).href;
  const breadcrumbs = [
    { name: "Games", path: "/games" },
    ...(game.platform
      ? [{ name: game.platform.name, path: `/platforms/${game.platform.slug}` }]
      : []),
    { name: game.title, path: `/games/${game.slug}` },
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map(({ name, path }, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            item: absolute(path),
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: game.title,
          url: absolute(`/games/${game.slug}`),
          sameAs: game.play_url,
          description: game.summary ?? undefined,
          image: game.cover_url ?? undefined,
          genre: game.genres.map(({ name }) => name),
          gamePlatform: "Web browser",
          applicationCategory: "Game",
          isBasedOn: {
            "@type": "VideoGame",
            name: game.original_title,
            gamePlatform: game.platform?.name,
          },
        }}
      />
      {game.hero_url && (
        <div className="relative aspect-[16/7] overflow-hidden rounded-xl border bg-surface sm:aspect-[1920/620]">
          <Image
            src={game.hero_url}
            alt=""
            fill
            sizes="(min-width: 1152px) 1120px, 100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8 md:flex-row md:gap-10">
        {/* On phones the hero already shows the art; dropping the cover keeps Play near the top. */}
        <div className={cn("w-40 shrink-0 sm:w-48 md:w-56", game.hero_url && "hidden sm:block")}>
          <div className="relative aspect-[2/3] overflow-hidden rounded-card border bg-surface">
            {game.cover_url ? (
              <Image
                src={game.cover_url}
                alt={`${game.original_title} cover art`}
                fill
                sizes="224px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center font-display font-extrabold text-muted-foreground [font-stretch:125%]">
                {game.title}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {game.platform && (
            <Link
              href={`/platforms/${game.platform.slug}`}
              className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: game.platform.color }}
              />
              Originally on {originalPlatform(game.platform)}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance break-words [font-stretch:125%] sm:text-[3.5rem]">
            {game.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A browser port of <span className="text-foreground">{game.original_title}</span>
          </p>

          {badges.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {badges.map(({ key, label, Icon }) => (
                <li
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-sm"
                >
                  <Icon aria-hidden className="size-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          )}

          {game.summary && <p className="mt-6 max-w-2xl leading-relaxed">{game.summary}</p>}

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={`/go/${game.slug}`} target="_blank" rel="nofollow noopener">
                Play
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
            <Suspense fallback={<FavoriteControlSkeleton />}>
              <FavoriteControl gameId={game.id} slug={game.slug} />
            </Suspense>
            {game.source_url && (
              <Button asChild size="lg" variant="outline">
                <a href={game.source_url} target="_blank" rel="noopener noreferrer">
                  <CodeIcon data-icon="inline-start" />
                  Source
                </a>
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Play opens {host} in a new tab.
            {game.link_status === "broken" && (
              <span className="text-destructive"> It didn&apos;t respond at our last check.</span>
            )}
          </p>

          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 text-sm sm:grid-cols-3">
            {game.developer && <Detail term="Developer">{game.developer}</Detail>}
            {game.tech && <Detail term="Tech">{game.tech}</Detail>}
            {game.genres.length > 0 && (
              <Detail term={game.genres.length === 1 ? "Genre" : "Genres"}>
                {game.genres.map((genre, index) => (
                  <span key={genre.id}>
                    {index > 0 && ", "}
                    <Link
                      href={`/genres/${genre.slug}`}
                      className="rounded-sm underline-offset-2 hover:underline"
                    >
                      {genre.name}
                    </Link>
                  </span>
                ))}
              </Detail>
            )}
            {game.published_at && (
              <Detail term="Added">{format(new Date(game.published_at), "d MMM yyyy")}</Detail>
            )}
          </dl>

          {game.requires_own_files && (
            <div className="mt-8 max-w-2xl">
              <InfoBox label="Bring your own files">
                This port needs files from a copy of the game you own. RetroInBrowser doesn&apos;t
                host or link to game files.
              </InfoBox>
            </div>
          )}

          {game.description && (
            <section aria-label="About this port" className="mt-10 max-w-2xl border-t pt-8">
              <RichText source={game.description} />
            </section>
          )}
        </div>
      </div>

      <section id="comments" aria-labelledby="comments-heading" className="mt-16 max-w-2xl">
        <h2
          id="comments-heading"
          className="font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]"
        >
          Comments
        </h2>
        <Suspense fallback={<CommentsSkeleton />}>
          <CommentsSection gameId={game.id} slug={game.slug} />
        </Suspense>
      </section>

      {similar.length > 0 && (
        <div className="mt-16">
          <GameRow id="row-similar" title="Similar games" games={similar} />
        </div>
      )}
    </article>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function GameSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Skeleton className="aspect-[16/7] w-full rounded-xl sm:aspect-[1920/620]" />
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:gap-10">
        <Skeleton className="hidden aspect-[2/3] shrink-0 rounded-card sm:block sm:w-48 md:w-56" />
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-4 h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
