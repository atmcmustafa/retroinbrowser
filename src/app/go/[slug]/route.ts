import { createHmac } from "node:crypto";
import { isIPv6 } from "node:net";
import { notFound } from "next/navigation";
import { after, NextResponse, type NextRequest } from "next/server";
import { getGameBySlug } from "@/lib/data/games";
import { serverEnv } from "@/lib/env.server";
import { clientIp } from "@/lib/request-ip";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Link unfurlers and crawlers follow Play links too; they shouldn't move the Popular ranking.
const botAgent = /bot|crawl|spider|slurp|preview|facebookexternalhit|embed/i;

// An IPv6 client usually owns a whole /64, so that prefix counts as one visitor.
function visitorAddress(ip: string) {
  // Plain IPv4, or IPv4 mapped into IPv6 (::ffff:1.2.3.4).
  const v4 = ip.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (v4) return v4;
  if (!isIPv6(ip)) return ip;
  const [head, tail = ""] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = [...left, ...Array(8 - left.length - right.length).fill("0"), ...right];
  return groups
    .slice(0, 4)
    .map((group) => parseInt(group, 16).toString(16))
    .join(":");
}

// The IP itself is never stored. The key includes the day, so rows can't be linked across days.
function visitorKey(ip: string | undefined) {
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", serverEnv.SUPABASE_SECRET_KEY)
    .update(`${day}|${ip ? visitorAddress(ip) : "unknown"}`)
    .digest("base64url");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  if (!botAgent.test(request.headers.get("user-agent") ?? "")) {
    const ip = clientIp(request.headers);
    // increment_click is closed to the public API; it counts each visitor once a day.
    after(async () => {
      const { error } = await createAdminClient().rpc("increment_click", {
        game_slug: slug,
        visitor: visitorKey(ip),
      });
      if (error) console.error("Counting click failed", slug, error);
    });
  }

  // Signed-in players get the game at the top of their recently played list. The claims check
  // is local (asymmetric JWT), so anonymous visitors cost nothing extra.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) {
    after(async () => {
      const { error } = await supabase.rpc("record_play", { p_game_id: game.id });
      if (error) console.error("Recording play failed", slug, error);
    });
  }

  return NextResponse.redirect(game.play_url, 302);
}
