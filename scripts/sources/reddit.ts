import { decodeEntities, fetchPage } from "../lib/http";
import { looksLikePort, type Mention, type Source } from "./types";

// Public RSS needs no app or key, but it rate-limits hard (429 after a couple of quick requests)
// and sometimes refuses datacenter IPs, so feeds are spaced out and a refused feed is skipped.
const feeds = [
  "r/WebGames/new/.rss",
  "r/webassembly/new/.rss",
  "r/emulation/search.rss?q=browser OR webassembly OR wasm OR recomp&restrict_sr=1&sort=new&t=week",
  "r/pcgaming/search.rss?q=browser port&restrict_sr=1&sort=new&t=week",
  "r/retrogaming/search.rss?q=browser&restrict_sr=1&sort=new&t=week",
];

const GAP_MS = 10_000;

export const reddit: Source = async (since) => {
  const mentions: Mention[] = [];
  let refused = 0;
  for (const [index, feed] of feeds.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, GAP_MS));
    const page = await fetchPage(`https://www.reddit.com/${feed.replace(/ /g, "+")}`);
    if (page.status !== 200) {
      console.warn(`Reddit answered ${page.status} for ${feed.split("?")[0]}`);
      refused++;
      continue;
    }

    for (const [, entry] of page.html.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const title = decodeEntities(/<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? "").trim();
      const post = /<link href="([^"]+)"/.exec(entry)?.[1];
      const published = /<published>([^<]+)<\/published>/.exec(entry)?.[1];
      // Link posts carry the submitted URL as the "[link]" anchor; text posts link to themselves.
      const content = decodeEntities(/<content[^>]*>([\s\S]*?)<\/content>/.exec(entry)?.[1] ?? "");
      const link = /<a href="([^"]+)">\[link\]<\/a>/.exec(content)?.[1];
      if (!post || !published || !link || !title) continue;
      if (new Date(published) < since || !looksLikePort(title)) continue;
      if (/^https?:\/\/(www\.|old\.)?reddit\.com\//.test(link) || /redd\.it\//.test(link)) continue;

      mentions.push({
        url: decodeEntities(link),
        title,
        source: "reddit",
        sourceRef: post,
        seenAt: new Date(published).toISOString(),
      });
    }
  }
  if (refused === feeds.length) throw new Error("every feed was refused");
  return mentions;
};
