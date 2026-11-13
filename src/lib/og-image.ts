import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { artworkBucket } from "@/lib/images";

// Share images are drawn by scripts/og.ts before each deploy build and stored in the artwork
// bucket, so the site never runs an image renderer. The file name carries a hash of everything
// drawn: an edit gives a new name, and unchanged games aren't redrawn.

// Bump when the card design changes, so every image is drawn again.
const OG_DESIGN_VERSION = 1;

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageAlt = "Game artwork with the port name and original game";

export type OgGame = {
  slug: string;
  title: string;
  original_title: string;
  hero_url: string | null;
  cover_url: string | null;
  mobile_support: boolean;
  gamepad_support: boolean;
  requires_own_files: boolean;
  platform: { name: string; color: string } | null;
};

export function ogImagePath(game: OgGame) {
  const drawn = [
    OG_DESIGN_VERSION,
    game.title,
    game.original_title,
    game.hero_url,
    game.cover_url,
    game.mobile_support,
    game.gamepad_support,
    game.requires_own_files,
    game.platform?.name ?? null,
    game.platform?.color ?? null,
  ];
  const hash = createHash("sha256").update(JSON.stringify(drawn)).digest("hex").slice(0, 12);
  return `og/${game.slug}-${hash}.jpg`;
}

export function ogImageUrl(game: OgGame) {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${artworkBucket}/${ogImagePath(game)}`;
}
