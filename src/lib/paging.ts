import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog-filter";

// Paged lists keep page 2 onward in the path (/popular/page/2), so each page's metadata is known
// at build time and sits in the static <head>. With ?page=N it streamed into <body>, and only a
// per-request render for crawlers could put it back in <head>.
export function pageHref(path: string, page: number) {
  return page > 1 ? `${path}/page/${page}` : path;
}

// Page 1 lives at the bare path, so /page/1 and /page/02 are 404s rather than duplicates.
export function parsePage(value: string) {
  if (!/^[1-9]\d{0,4}$/.test(value) || value === "1") notFound();
  return Number(value);
}

export function pageNumbers(total: number) {
  const last = Math.ceil(total / CATALOG_PAGE_SIZE);
  return Array.from({ length: Math.max(0, last - 1) }, (_, index) => String(index + 2));
}

export function pagedMetadata({
  title,
  description,
  path,
  page,
}: {
  title: string;
  description: string;
  path: string;
  page: number;
}): Metadata {
  if (page <= 1) return { title, description, alternates: { canonical: path } };
  return {
    title: `${title}, page ${page}`,
    description,
    alternates: { canonical: pageHref(path, page) },
  };
}
