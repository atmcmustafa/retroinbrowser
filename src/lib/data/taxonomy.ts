import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

export async function getPlatforms() {
  "use cache";
  cacheTag("taxonomy");
  cacheLife("days");

  const { data, error } = await createPublicClient()
    .from("platforms")
    .select("id, slug, name, short_name, color")
    .order("sort");
  if (error) throw error;
  return data;
}

export async function getGenres() {
  "use cache";
  cacheTag("taxonomy");
  cacheLife("days");

  const { data, error } = await createPublicClient()
    .from("genres")
    .select("id, slug, name, icon")
    .order("sort");
  if (error) throw error;
  return data;
}
