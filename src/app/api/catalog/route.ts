import { getCatalogIndex } from "@/lib/data/games";

// Prerendered with the site: the search page and the search palette filter it in the browser.
export async function GET() {
  return Response.json(await getCatalogIndex());
}
