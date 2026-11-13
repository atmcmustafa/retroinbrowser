import type { CatalogSort } from "@/lib/search-params";
import { toSearchTerm } from "@/lib/search";

// The browser-side twin of searchCatalog (src/lib/data/games.ts), over /api/catalog.

export const CATALOG_PAGE_SIZE = 36;

export type CatalogItem = {
  title: string;
  original_title: string;
  developer: string | null;
  published_at: string | null;
  mobile_support: boolean;
  gamepad_support: boolean;
  requires_own_files: boolean;
  genre_ids: number[];
  platform: { slug: string } | null;
};

export type CatalogFilter = {
  q: string;
  genreId: number | null;
  platform: string | null;
  mobile: boolean;
  gamepad: boolean;
  noFiles: boolean;
  sort: CatalogSort;
};

const byTitle = (a: CatalogItem, b: CatalogItem) => a.title.localeCompare(b.title, "en");

// Items arrive in Popular order, so that sort keeps it.
export function filterCatalog<T extends CatalogItem>(items: T[], filter: CatalogFilter): T[] {
  const term = toSearchTerm(filter.q).toLowerCase();
  const matches = items.filter(
    (item) =>
      (!term ||
        [item.title, item.original_title, item.developer].some((text) =>
          text?.toLowerCase().includes(term),
        )) &&
      (filter.genreId === null || item.genre_ids.includes(filter.genreId)) &&
      (filter.platform === null || item.platform?.slug === filter.platform) &&
      (!filter.mobile || item.mobile_support) &&
      (!filter.gamepad || item.gamepad_support) &&
      (!filter.noFiles || !item.requires_own_files),
  );

  if (filter.sort === "title") return matches.sort(byTitle);
  if (filter.sort === "new") {
    return matches.sort(
      (a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "") || byTitle(a, b),
    );
  }
  return matches;
}
