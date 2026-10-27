"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isSteamGridArtwork } from "@/lib/images";
import { gameSchema, type GameInput } from "@/lib/schemas/game";
import { importArtwork, removeArtwork } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { Constants, type Database, type Enums } from "@/types/database";

type FieldErrors = Partial<Record<keyof GameInput, string>>;

export type SaveGameResult =
  | { ok: true; id: string; cover_url: string; hero_url: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const idSchema = z.uuid();

const uniqueConstraints: Record<string, { field: keyof GameInput; message: string }> = {
  games_slug_key: { field: "slug", message: "Another game already uses this slug." },
  games_play_url_key: { field: "play_url", message: "Another game already links to this URL." },
};

export async function saveGame(
  id: string | null,
  input: GameInput,
  candidateId: string | null = null,
): Promise<SaveGameResult> {
  const admin = await requireAdmin();
  if (id !== null && !idSchema.safeParse(id).success)
    return { ok: false, message: "Unknown game." };

  const parsed = gameSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof GameInput;
      fieldErrors[field] ??= issue.message;
    }
    return { ok: false, message: "Check the highlighted fields.", fieldErrors };
  }

  const { genre_ids, ...values } = parsed.data;
  const supabase = await createClient();

  let previous: { cover_url: string | null; hero_url: string | null } | null = null;
  if (id) {
    const { data } = await supabase
      .from("games")
      .select("cover_url, hero_url")
      .eq("id", id)
      .maybeSingle();
    if (!data) return { ok: false, message: "Unknown game." };
    previous = data;
  }

  const uploaded: string[] = [];
  const artwork = { cover: values.cover_url, hero: values.hero_url };
  try {
    for (const kind of ["cover", "hero"] as const) {
      if (!isSteamGridArtwork(artwork[kind])) continue;
      artwork[kind] = await importArtwork(supabase, artwork[kind], kind, values.slug);
      uploaded.push(artwork[kind]);
    }
  } catch (error) {
    console.error("Artwork import failed", error);
    await removeArtwork(supabase, uploaded);
    return { ok: false, message: "Couldn't import the artwork. Try another image." };
  }

  const row = {
    ...values,
    source_url: values.source_url || null,
    developer: values.developer || null,
    summary: values.summary || null,
    tech: values.tech || null,
    cover_url: artwork.cover || null,
    hero_url: artwork.hero || null,
  };

  const saved = id
    ? await supabase.from("games").update(row).eq("id", id).select("id").single()
    : await supabase.from("games").insert(row).select("id").single();

  if (saved.error) {
    await removeArtwork(supabase, uploaded);
    const unique =
      saved.error.code === "23505"
        ? Object.entries(uniqueConstraints).find(([name]) => saved.error.message.includes(name))
        : undefined;
    if (unique) {
      const { field, message } = unique[1];
      return { ok: false, message, fieldErrors: { [field]: message } };
    }
    console.error("Saving game failed", saved.error);
    return { ok: false, message: "Couldn't save the game." };
  }

  const gameId = saved.data.id;
  updateTag("games");
  if (!id && candidateId) await approveCandidate(supabase, candidateId, gameId, admin.id);

  if (!(await syncGenres(supabase, gameId, genre_ids))) {
    return { ok: false, message: "Game saved, but its genres couldn't be updated. Save again." };
  }

  if (previous) {
    await removeArtwork(supabase, [
      previous.cover_url !== row.cover_url ? previous.cover_url : null,
      previous.hero_url !== row.hero_url ? previous.hero_url : null,
    ]);
  }

  return { ok: true, id: gameId, cover_url: row.cover_url ?? "", hero_url: row.hero_url ?? "" };
}

// The game is already saved; a failed link only leaves the candidate pending, so just log it.
async function approveCandidate(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  gameId: string,
  adminId: string,
) {
  if (!idSchema.safeParse(candidateId).success) return;
  const { error } = await supabase
    .from("candidates")
    .update({
      status: "approved",
      game_id: gameId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq("id", candidateId)
    .eq("status", "pending");
  if (error) console.error("Approving candidate failed", candidateId, error);
}

async function syncGenres(supabase: SupabaseClient<Database>, gameId: string, genreIds: number[]) {
  const removed = await supabase
    .from("game_genres")
    .delete()
    .eq("game_id", gameId)
    .not("genre_id", "in", `(${genreIds.join(",")})`);
  if (removed.error) {
    console.error("Removing genres failed", removed.error);
    return false;
  }

  const added = await supabase.from("game_genres").upsert(
    genreIds.map((genre_id) => ({ game_id: gameId, genre_id })),
    { ignoreDuplicates: true },
  );
  if (added.error) {
    console.error("Adding genres failed", added.error);
    return false;
  }
  return true;
}

export async function deleteGame(id: string): Promise<{ ok: false; message: string }> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Unknown game." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .delete()
    .eq("id", id)
    .select("cover_url, hero_url")
    .maybeSingle();
  if (error) {
    console.error("Deleting game failed", error);
    return { ok: false, message: "Couldn't delete the game." };
  }
  if (data) await removeArtwork(supabase, [data.cover_url, data.hero_url]);

  updateTag("games");
  redirect("/admin/games");
}

export type BulkStatusResult = { ok: true; count: number } | { ok: false; message: string };

const bulkStatusSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
  status: z.enum(Constants.public.Enums.game_status),
});

export async function setGamesStatus(
  ids: string[],
  status: Enums<"game_status">,
): Promise<BulkStatusResult> {
  await requireAdmin();
  const parsed = bulkStatusSchema.safeParse({ ids, status });
  if (!parsed.success) return { ok: false, message: "Select at least one game." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .update({ status: parsed.data.status })
    .in("id", parsed.data.ids)
    .select("id");
  if (error) {
    console.error("Bulk status update failed", error);
    return { ok: false, message: "Couldn't update the games." };
  }

  updateTag("games");
  return { ok: true, count: data.length };
}

// For edits made outside these actions (SQL, scripts, the Supabase dashboard).
export async function refreshPublicCache() {
  await requireAdmin();
  updateTag("games");
  updateTag("taxonomy");
}
