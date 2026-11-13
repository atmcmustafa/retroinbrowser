"use client";

import type { CatalogEntry } from "@/lib/data/games";

let request: Promise<CatalogEntry[]> | null = null;

// One fetch per page load, shared by the search page and the search palette.
export function loadCatalog() {
  request ??= fetch("/api/catalog")
    .then((res) => (res.ok ? (res.json() as Promise<CatalogEntry[]>) : Promise.reject()))
    .catch((error: unknown) => {
      request = null;
      throw error;
    });
  return request;
}
