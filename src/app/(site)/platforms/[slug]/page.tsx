import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogResults } from "@/components/site/catalog-results";
import { FilterLink, ListingSkeleton } from "@/components/site/listing";
import { PageHeading } from "@/components/site/page-heading";
import { allGames } from "@/lib/data/games";
import { getPlatforms } from "@/lib/data/taxonomy";
import { loadPageParams } from "@/lib/search-params";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function findPlatform(slug: string) {
  const platforms = await getPlatforms();
  return platforms.find((platform) => platform.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const platforms = await getPlatforms();
  return platforms.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const platform = await findPlatform((await params).slug);
  if (!platform) return { title: "Platform not found" };
  return {
    title: `${platform.name} games in your browser`,
    description: `Classic ${platform.name} games ported to run in your browser.`,
    alternates: { canonical: `/platforms/${platform.slug}` },
  };
}

export default function PlatformPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ListingSkeleton />}>
        <Platform params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Platform({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const platform = await findPlatform((await params).slug);
  if (!platform) notFound();
  const { page } = await loadPageParams(searchParams);
  const path = `/platforms/${platform.slug}`;

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
        description={`Classic ${platform.name} games ported to the browser.`}
      />
      <FilterLink href={`/games?platform=${platform.slug}`} />
      <div className="mt-10">
        <CatalogResults
          query={{ ...allGames, platformId: platform.id, sort: "popular", page: Math.max(1, page) }}
          hrefFor={(target) => (target > 1 ? `${path}?page=${target}` : path)}
        />
      </div>
    </>
  );
}
