import "server-only";
import { cardColumns } from "@/lib/data/games";
import { createClient } from "@/lib/supabase/server";

// Read with the user's own session (RLS: own rows, published games). Never cached: per user.
// The inner joins drop games unpublished after they were saved or played, before the limit.

export async function getFavorites(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(`created_at, game:games!inner(${cardColumns})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map(({ game }) => game);
}

export async function getRecentlyPlayed(userId: string, limit: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_history")
    .select(`played_at, game:games!inner(${cardColumns})`)
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(({ game, played_at }) => ({ ...game, played_at }));
}

export async function isFavorite(userId: string, gameId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("favorites")
    .select("game_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("game_id", gameId);
  if (error) throw error;
  return Boolean(count);
}
