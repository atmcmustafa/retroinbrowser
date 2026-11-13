import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/site/listing";
import { PopularList, popularMetadata } from "@/components/site/paged-lists";
import { getCatalogCounts } from "@/lib/data/games";
import { pageNumbers, parsePage } from "@/lib/paging";

type Params = Promise<{ page: string }>;

export async function generateStaticParams() {
  const { total } = await getCatalogCounts();
  const pages = pageNumbers(total).map((page) => ({ page }));
  // Cache Components rejects an empty list at build time; a page past the end renders notFound().
  return pages.length ? pages : [{ page: "2" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return popularMetadata(parsePage((await params).page));
}

export default function PopularPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ListingSkeleton />}>
        <Popular params={params} />
      </Suspense>
    </div>
  );
}

async function Popular({ params }: { params: Params }) {
  return <PopularList page={parsePage((await params).page)} />;
}
