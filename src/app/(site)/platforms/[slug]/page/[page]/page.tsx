import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/site/listing";
import { findPlatform, PlatformList, platformMetadata } from "@/components/site/paged-lists";
import { getCatalogCounts } from "@/lib/data/games";
import { getPlatforms } from "@/lib/data/taxonomy";
import { pageNumbers, parsePage } from "@/lib/paging";

type Params = Promise<{ slug: string; page: string }>;

export async function generateStaticParams() {
  const [platforms, counts] = await Promise.all([getPlatforms(), getCatalogCounts()]);
  const pages = platforms.flatMap(({ id, slug }) =>
    pageNumbers(counts.platforms[id] ?? 0).map((page) => ({ slug, page })),
  );
  return pages.length ? pages : [{ slug: "__placeholder__", page: "2" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, page } = await params;
  const platform = await findPlatform(slug);
  if (!platform) return { title: "Platform not found" };
  return platformMetadata(platform, parsePage(page));
}

export default function PlatformPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ListingSkeleton />}>
        <Platform params={params} />
      </Suspense>
    </div>
  );
}

async function Platform({ params }: { params: Params }) {
  const { slug, page } = await params;
  const platform = await findPlatform(slug);
  if (!platform) notFound();
  return <PlatformList platform={platform} page={parsePage(page)} />;
}
