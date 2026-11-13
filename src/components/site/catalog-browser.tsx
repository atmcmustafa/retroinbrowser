"use client";

import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameGrid, GameGridSkeleton } from "@/components/site/game-grid";
import { loadCatalog } from "@/components/site/load-catalog";
import { Pagination } from "@/components/site/pagination";
import { CATALOG_PAGE_SIZE, filterCatalog } from "@/lib/catalog-filter";
import type { CatalogEntry } from "@/lib/data/games";
import { catalogParams } from "@/lib/search-params";

// /games filters the whole catalog in the browser, so the page stays static.
export function CatalogBrowser({ genres }: { genres: { id: number; slug: string }[] }) {
  const [filters, setFilters] = useQueryStates(catalogParams);
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCatalog()
      .then(setEntries)
      .catch(() => setFailed(true));
  }, []);

  const genreId = genres.find(({ slug }) => slug === filters.genre)?.id ?? null;
  const results = useMemo(
    () =>
      entries &&
      filterCatalog(entries, {
        q: filters.q,
        // An unknown genre slug matches nothing rather than everything.
        genreId: filters.genre && genreId === null ? -1 : genreId,
        platform: filters.platform,
        mobile: filters.mobile,
        gamepad: filters.gamepad,
        noFiles: filters.nofiles,
        sort: filters.sort,
      }),
    [entries, filters, genreId],
  );

  if (failed) return <EmptyState>The catalog couldn&apos;t load. Reload the page.</EmptyState>;
  if (!results) return <GameGridSkeleton />;

  const filtered = Boolean(
    filters.q ||
    filters.genre ||
    filters.platform ||
    filters.mobile ||
    filters.gamepad ||
    filters.nofiles,
  );
  if (results.length === 0) {
    return (
      <EmptyState>
        {filtered ? (
          <>
            No games match these filters.{" "}
            <button
              type="button"
              onClick={() => void setFilters(null)}
              className="rounded-sm text-foreground underline underline-offset-2"
            >
              Clear filters
            </button>
          </>
        ) : (
          "No games have been published yet."
        )}
      </EmptyState>
    );
  }

  const totalPages = Math.ceil(results.length / CATALOG_PAGE_SIZE);
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const shown = results.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);

  return (
    <div ref={top} className="scroll-mt-6">
      <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
        {results.length.toLocaleString("en-US")} {results.length === 1 ? "game" : "games"}
      </p>
      <GameGrid games={shown} />
      <Pagination
        page={page}
        totalPages={totalPages}
        onPage={(target) => {
          void setFilters({ page: target > 1 ? target : null });
          top.current?.scrollIntoView();
        }}
      />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
      {children}
    </p>
  );
}
