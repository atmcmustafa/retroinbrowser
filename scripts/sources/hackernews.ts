import { fetchJson } from "../lib/http";
import { looksLikePort, type Mention, type Source } from "./types";

const queries = [
  "browser port",
  "web port",
  "ported to the browser",
  "ported to the web",
  "WebAssembly port",
  "wasm port",
  "playable in the browser",
  "runs in the browser",
  "static recompilation",
  "decompilation",
  "source port",
];

type Hit = {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number | null;
  created_at: string;
};

export const hackerNews: Source = async (since) => {
  const after = Math.floor(since.getTime() / 1000);
  const mentions: Mention[] = [];
  for (const query of queries) {
    const params = new URLSearchParams({
      query,
      tags: "story",
      numericFilters: `created_at_i>${after}`,
      hitsPerPage: "50",
    });
    const { hits } = await fetchJson<{ hits: Hit[] }>(
      `https://hn.algolia.com/api/v1/search_by_date?${params}`,
    );
    for (const hit of hits) {
      if (!hit.url || !hit.title || !looksLikePort(hit.title)) continue;
      mentions.push({
        url: hit.url,
        title: hit.title,
        source: "hackernews",
        sourceRef: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        points: hit.points ?? 0,
        seenAt: hit.created_at,
      });
    }
  }
  return mentions;
};
