import type { Metadata } from "next";
import { searchCatalog, type CatalogQuery } from "@/lib/data/games";

export async function pagedMetadata({
  title,
  description,
  path,
  query,
}: {
  title: string;
  description: string;
  path: string;
  query: CatalogQuery;
}): Promise<Metadata> {
  const { page } = query;
  if (page <= 1) return { title, description, alternates: { canonical: path } };

  const { total } = await searchCatalog(query);
  if (total === null) return { title, description, robots: { index: false } };

  return {
    title: `${title}, page ${page}`,
    description,
    alternates: { canonical: `${path}?page=${page}` },
  };
}
