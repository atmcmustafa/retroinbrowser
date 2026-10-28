import { getFeedGames } from "@/lib/data/games";
import { env } from "@/lib/env";
import { siteName } from "@/lib/site";

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);
const absolute = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).href;

// RSS of newly listed ports, for feed readers and as a second sitemap that search engines
// recrawl more often. Dates come from the data: new Date() isn't allowed while prerendering.
export async function GET() {
  const games = await getFeedGames(50);
  const items = games.map((game) => {
    const url = absolute(`/games/${game.slug}`);
    const platform = game.platform ? ` (${game.platform.name})` : "";
    return [
      "<item>",
      `<title>${escapeXml(`${game.title}, a browser port of ${game.original_title}${platform}`)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      game.published_at && `<pubDate>${new Date(game.published_at).toUTCString()}</pubDate>`,
      game.summary && `<description>${escapeXml(game.summary)}</description>`,
      "</item>",
    ]
      .filter(Boolean)
      .join("");
  });
  const latest = games[0]?.published_at;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${siteName}: new games</title>`,
    `<link>${absolute("/new")}</link>`,
    "<description>Classic games newly ported to the browser and added to the directory.</description>",
    "<language>en</language>",
    `<atom:link href="${absolute("/feed.xml")}" rel="self" type="application/rss+xml"/>`,
    latest ? `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : "",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
