import { notFound } from "next/navigation";
import { after, NextResponse, type NextRequest } from "next/server";
import { getGameBySlug } from "@/lib/data/games";
import { createPublicClient } from "@/lib/supabase/server";

// Link unfurlers and crawlers follow Play links too; they shouldn't move the Popular ranking.
const botAgent = /bot|crawl|spider|slurp|preview|facebookexternalhit|embed/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  if (!botAgent.test(request.headers.get("user-agent") ?? "")) {
    after(async () => {
      const { error } = await createPublicClient().rpc("increment_click", { game_slug: slug });
      if (error) console.error("Counting click failed", slug, error);
    });
  }

  return NextResponse.redirect(game.play_url, 302);
}
