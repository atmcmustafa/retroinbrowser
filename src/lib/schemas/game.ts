import { z } from "zod";
import { isSteamGridArtwork, storedArtworkPath } from "@/lib/images";
import { Constants, type Enums } from "@/types/database";

export const gameStatusLabels: Record<Enums<"game_status">, string> = {
  published: "Published",
  draft: "Draft",
  hidden: "Hidden",
};

// The URL parser accepts "https:example.com" but the raw string is stored, and the database
// only takes values that start with http(s)://.
const webUrl = z
  .string()
  .regex(/^https?:\/\//i, "Enter a full http(s) URL")
  .pipe(z.url({ protocol: /^https?$/, error: "Enter a full http(s) URL" }));

const artworkUrl = z
  .string()
  .refine(
    (value) => value === "" || isSteamGridArtwork(value) || storedArtworkPath(value) !== null,
    "Unsupported image source",
  );

export const gameSchema = z.object({
  title: z.string().trim().min(1, "Required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  original_title: z.string().trim().min(1, "Required").max(160),
  platform_id: z.number({ error: "Choose a platform" }).int().positive(),
  genre_ids: z
    .array(z.number().int().positive())
    .min(1, "Pick at least one genre")
    .max(5, "Pick up to five genres"),
  play_url: z.string().trim().pipe(webUrl),
  source_url: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), webUrl])),
  developer: z.string().trim().max(120),
  summary: z.string().trim().max(280, "Keep it under 280 characters"),
  tech: z.string().trim().max(60),
  cover_url: artworkUrl,
  hero_url: artworkUrl,
  steamgriddb_id: z.number().int().positive().nullable(),
  requires_own_files: z.boolean(),
  mobile_support: z.boolean(),
  gamepad_support: z.boolean(),
  featured: z.boolean(),
  status: z.enum(Constants.public.Enums.game_status),
});

export type GameInput = z.infer<typeof gameSchema>;
