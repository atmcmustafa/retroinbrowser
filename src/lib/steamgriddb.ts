import "server-only";
import { serverEnv } from "@/lib/env.server";
import { isSteamGridArtwork, type Artwork, type ArtworkGame, type ArtworkKind } from "@/lib/images";

const API = "https://www.steamgriddb.com/api/v2";

const artworkQuery = {
  cover: { path: "grids", dimensions: "600x900" },
  hero: { path: "heroes", dimensions: "1920x620,3840x1240" },
} satisfies Record<ArtworkKind, { path: string; dimensions: string }>;

type ApiGame = { id: number; name: string; release_date?: number };
type ApiArtwork = {
  id: number;
  url: string;
  thumb: string;
  width: number;
  height: number;
  score?: number;
  author?: { name?: string };
};

async function request<T>(path: string): Promise<T> {
  const key = serverEnv.STEAMGRIDDB_API_KEY;
  if (!key) throw new Error("STEAMGRIDDB_API_KEY is not set");

  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`SteamGridDB responded ${res.status}`);

  // During outages the API answers 200 with an empty HTML body.
  const text = await res.text();
  let body: { success: boolean; data: T };
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`SteamGridDB returned no JSON (${res.status}, ${text.length} bytes)`);
  }
  if (!body.success) throw new Error("SteamGridDB request failed");
  return body.data;
}

export async function searchSteamGridGames(term: string): Promise<ArtworkGame[]> {
  const games = await request<ApiGame[]>(`/search/autocomplete/${encodeURIComponent(term)}`);
  return games.slice(0, 20).map((game) => ({
    id: game.id,
    name: game.name,
    year: game.release_date ? new Date(game.release_date * 1000).getUTCFullYear() : null,
  }));
}

export async function getSteamGridArtwork(gameId: number, kind: ArtworkKind): Promise<Artwork[]> {
  const { path, dimensions } = artworkQuery[kind];
  const params = new URLSearchParams({
    dimensions,
    types: "static",
    nsfw: "false",
    humor: "false",
    limit: "50",
  });
  const artwork = await request<ApiArtwork[]>(`/${path}/game/${gameId}?${params}`);
  return artwork
    .filter((item) => isSteamGridArtwork(item.url))
    .map((item) => ({
      id: item.id,
      url: item.url,
      thumb: item.thumb,
      width: item.width,
      height: item.height,
      score: item.score ?? 0,
      author: item.author?.name ?? null,
    }));
}
