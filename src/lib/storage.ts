import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  artworkBucket,
  isSteamGridArtwork,
  storedArtworkPath,
  type ArtworkKind,
} from "@/lib/images";
import type { Database } from "@/types/database";

const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

const artworkSize = {
  cover: { width: 600, height: 900 },
  hero: { width: 1920, height: 620 },
} satisfies Record<ArtworkKind, { width: number; height: number }>;

export async function importArtwork(
  supabase: SupabaseClient<Database>,
  sourceUrl: string,
  kind: ArtworkKind,
  slug: string,
) {
  if (!isSteamGridArtwork(sourceUrl)) throw new Error("Unsupported artwork source");

  const res = await fetch(sourceUrl, { redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Artwork download failed (${res.status})`);
  if (Number(res.headers.get("content-length")) > MAX_DOWNLOAD_BYTES) {
    throw new Error("Artwork is too large");
  }
  const input = Buffer.from(await res.arrayBuffer());
  if (input.byteLength > MAX_DOWNLOAD_BYTES) throw new Error("Artwork is too large");

  const output = await sharp(input)
    .resize({ ...artworkSize[kind], fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();

  // A fresh name per upload keeps CDN and next/image caches from serving the old file.
  const path = `${kind}/${slug}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const bucket = supabase.storage.from(artworkBucket);
  const { error } = await bucket.upload(path, output, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw error;

  return bucket.getPublicUrl(path).data.publicUrl;
}

export async function removeArtwork(
  supabase: SupabaseClient<Database>,
  urls: (string | null | undefined)[],
) {
  const paths = urls.flatMap((url) => {
    const path = url ? storedArtworkPath(url) : null;
    return path ? [path] : [];
  });
  if (!paths.length) return;

  const { error } = await supabase.storage.from(artworkBucket).remove(paths);
  if (error) console.error("Removing artwork failed", paths, error);
}
