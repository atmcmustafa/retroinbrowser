import { decodeEntities, fetchPage } from "../lib/http";
import type { Mention, Source } from "./types";

// Port directories whose robots.txt lets us read them, as leads while the catalog grows. Only a
// port's name and link are kept; extract then reads the port's own page, and an admin approves.
const INDEX_URL = "https://portedgames.com/llms.txt";
const LISTING_URL = "https://recompiledgames.com/";

// Entry pages are fetched only until they are known, so a run stays short and polite.
const MAX_PAGES_PER_RUN = 40;
const PAGE_GAP_MS = 700;

const notPort =
  /(steampowered|gog\.com|wikipedia|youtube|youtu\.be|reddit|twitter|x\.com|bsky|discord|mastodon|facebook|instagram|tiktok|patreon|ko-fi|paypal|archive\.org|news\.ycombinator|pcgamingwiki|mobygames|tomshardware|kotaku|pcgamer|gamespot|ign\.com|eurogamer|polygon|theverge|arstechnica|hackaday|80\.lv|gamesradar|techspot|timeextension|xda-developers|notebookcheck|dexerto|nintendolife|tweaktown|wccftech|engadget|techradar|pcworld|rockpapershotgun|vg247|dsogaming|medium\.com|substack|twelve\.tools)/i;
const repoHost = /(^|\.)(github\.com|gitlab\.com|codeberg\.org)$/i;

export type IndexEntry = { name: string; page: string };

// "- [Name](https://host/slug/): Browser (engine rewrite), Game (Platform). ..."
// Fan games are new games that borrow a name, not ports, so they are left out here.
export function parseIndex(text: string): IndexEntry[] {
  const entries = new Map<string, IndexEntry>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^- \[([^\]]+)\]\((https:\/\/[^)]+)\):\s*Browser\b\s*(?:\(([^)]*)\))?/.exec(line);
    if (!match || /fan game/i.test(match[3] ?? "")) continue;
    entries.set(match[2], { name: match[1], page: match[2] });
  }
  return [...entries.values()];
}

// An entry page links the live port among its sources; prefer the link labelled as such, then
// anything that isn't a store, a repo or an article.
export function pickPortLink(html: string, pageUrl: string): string | null {
  const own = new URL(pageUrl).hostname;
  const links: { href: string; label: string }[] = [];
  for (const [, href, label] of html.matchAll(
    /<a\b[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
  )) {
    if (URL.parse(href)?.hostname === own || notPort.test(href)) continue;
    links.push({ href: decodeEntities(href), label: label.replace(/<[^>]+>/g, " ") });
  }
  const live = links.find(({ label }) =>
    /live page|live site|official site|^\s*play\b/i.test(label),
  );
  const isRepo = ({ href }: { href: string }) => repoHost.test(URL.parse(href)?.hostname ?? "");
  return (live ?? links.find((link) => !isRepo(link)) ?? links.find(isRepo))?.href ?? null;
}

export type ListingEntry = { name: string; url: string; page: string };

// One table row per game: its name links the directory's page, a "PLAY" button links the port.
export function parseListing(html: string, listingUrl: string): ListingEntry[] {
  const entries: ListingEntry[] = [];
  for (const row of html.split(/<li\b/).slice(1)) {
    const game = /class="c-game"[^>]*>\s*<a href="([^"]+)">([^<]+)<\/a>/.exec(row);
    const play = /<a\b[^>]*class="play[^"]*"[^>]*href="(https?:[^"]+)"/.exec(row);
    if (!game || !play) continue;
    entries.push({
      name: decodeEntities(game[2]).trim(),
      url: decodeEntities(play[1]),
      page: new URL(game[1], listingUrl).href,
    });
  }
  return entries;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// `known` skips entries already recorded, the same way the Google News source does.
export const directories =
  (known: (ref: string) => boolean): Source =>
  async () => {
    const seenAt = new Date().toISOString();
    const mentions: Mention[] = [];
    const add = (url: string, title: string, sourceRef: string) =>
      mentions.push({ url, title, source: "directory", sourceRef, seenAt });

    const listing = await fetchPage(LISTING_URL);
    if (listing.status < 400) {
      for (const { name, url, page } of parseListing(listing.html, LISTING_URL)) {
        if (!known(page)) add(url, name, page);
      }
    }

    const index = await fetchPage(INDEX_URL);
    if (index.status >= 400) return mentions;
    const pending = parseIndex(index.html).filter(({ page }) => !known(page));
    for (const { name, page } of pending.slice(0, MAX_PAGES_PER_RUN)) {
      const entry = await fetchPage(page).catch(() => null);
      const url = entry && entry.status < 400 ? pickPortLink(entry.html, page) : null;
      if (url) add(url, name, page);
      await sleep(PAGE_GAP_MS);
    }
    return mentions;
  };
