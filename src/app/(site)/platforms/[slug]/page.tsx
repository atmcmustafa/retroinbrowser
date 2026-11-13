import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/site/listing";
import { findPlatform, PlatformList, platformMetadata } from "@/components/site/paged-lists";
import { getPlatforms } from "@/lib/data/taxonomy";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const platforms = await getPlatforms();
  return platforms.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const platform = await findPlatform((await params).slug);
  if (!platform) return { title: "Platform not found" };
  return platformMetadata(platform, 1);
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
  const platform = await findPlatform((await params).slug);
  if (!platform) notFound();
  return <PlatformList platform={platform} page={1} />;
}
