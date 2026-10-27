import { getSearchIndex } from "@/lib/data/games";

// Loaded by the search palette on first open; prerendered and expired with the "games" tag.
export async function GET() {
  return Response.json(await getSearchIndex());
}
