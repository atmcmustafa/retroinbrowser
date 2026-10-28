"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LibraryResult = { ok: true } | { ok: false; message: string };

const favoriteSchema = z.object({ gameId: z.uuid(), saved: z.boolean() });

export async function setFavorite(gameId: string, saved: boolean): Promise<LibraryResult> {
  const user = await requireUser();
  const parsed = favoriteSchema.safeParse({ gameId, saved });
  if (!parsed.success) return { ok: false, message: "Unknown game." };

  const supabase = await createClient();
  const { error } = parsed.data.saved
    ? await supabase.from("favorites").insert({ user_id: user.id, game_id: parsed.data.gameId })
    : await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", parsed.data.gameId);
  // Saving twice (two tabs) hits the primary key; the game is saved either way.
  if (error && error.code !== "23505") {
    console.error("Updating favorite failed", error);
    return { ok: false, message: "Couldn't update your favorites. Try again." };
  }
  return { ok: true };
}

export async function clearPlayHistory(): Promise<LibraryResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("play_history").delete().eq("user_id", user.id);
  if (error) {
    console.error("Clearing play history failed", error);
    return { ok: false, message: "Couldn't clear the list. Try again." };
  }
  refresh();
  return { ok: true };
}
