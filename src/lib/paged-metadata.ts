import type { Metadata } from "next";

// Page 2 onward is its own document with its own games, so it keeps its own canonical. Pointing
// every page at page 1 would tell search engines to ignore the games listed after it.
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
  const paged = page > 1;
  return {
    title: paged ? `${title}, page ${page}` : title,
    description,
    alternates: { canonical: paged ? `${path}?page=${page}` : path },
  };
}
