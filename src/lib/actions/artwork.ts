"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { Artwork, ArtworkGame } from "@/lib/images";
import { getSteamGridArtwork, searchSteamGridGames } from "@/lib/steamgriddb";

export type ArtworkResult<T> = { ok: true; data: T } | { ok: false; message: string };

const searchSchema = z.string().trim().min(1).max(100);
const listSchema = z.object({
  gameId: z.number().int().positive(),
  kind: z.enum(["cover", "hero"]),
});

export async function searchArtworkGames(term: string): Promise<ArtworkResult<ArtworkGame[]>> {
  await requireAdmin();
  const parsed = searchSchema.safeParse(term);
  if (!parsed.success) return { ok: false, message: "Enter a game name." };

  try {
    return { ok: true, data: await searchSteamGridGames(parsed.data) };
  } catch (error) {
    console.error("SteamGridDB search failed", error);
    return { ok: false, message: "SteamGridDB search failed. Try again." };
  }
}

export async function listArtwork(gameId: number, kind: string): Promise<ArtworkResult<Artwork[]>> {
  await requireAdmin();
  const parsed = listSchema.safeParse({ gameId, kind });
  if (!parsed.success) return { ok: false, message: "Unknown game." };

  try {
    return { ok: true, data: await getSteamGridArtwork(parsed.data.gameId, parsed.data.kind) };
  } catch (error) {
    console.error("SteamGridDB artwork failed", error);
    return { ok: false, message: "Couldn't load artwork. Try again." };
  }
}
