import { env } from "@/lib/env";

export type ArtworkKind = "cover" | "hero";
export type ArtworkGame = { id: number; name: string; year: number | null };
export type Artwork = {
  id: number;
  url: string;
  thumb: string;
  width: number;
  height: number;
  author: string | null;
};

export const artworkBucket = "covers";

const storedPrefix = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${artworkBucket}/`;
const storedPath = /^(cover|hero)\/[a-z0-9-]+\.webp$/;
const steamGridUrl =
  /^https:\/\/cdn2\.steamgriddb\.com\/(grid|hero)\/[A-Za-z0-9]+\.(png|jpe?g|webp)$/;

export function storedArtworkPath(url: string) {
  if (!url.startsWith(storedPrefix)) return null;
  const path = url.slice(storedPrefix.length);
  return storedPath.test(path) ? path : null;
}

export function isSteamGridArtwork(url: string) {
  return steamGridUrl.test(url);
}
