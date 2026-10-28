import { decodeEntities, fetchPage } from "../lib/http";
import { looksLikePort, type Mention, type Source } from "./types";

const queries = [
  '"browser port"',
  '"playable in browser"',
  '"play in your browser" port',
  '"ported to the browser"',
  '"WebAssembly" game port',
  '"recompilation" browser game',
  '"decompilation" browser game',
];

type Item = { title: string; link: string; pubDate: string; publisher: string };

function parseItems(xml: string): Item[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, body]) => {
    const field = (name: string) =>
      decodeEntities(
        new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`).exec(body)?.[1] ?? "",
      ).trim();
    return {
      title: field("title"),
      link: field("link"),
      pubDate: field("pubDate"),
      publisher: field("source"),
    };
  });
}

// RSS links point at a news.google.com wrapper. Its page carries a signature and timestamp
// that the batchexecute endpoint trades for the article URL; this is what news.google.com's
// own redirect does. Undocumented, so a failure only skips the item.
async function resolveArticle(wrapper: string) {
  const id = new URL(wrapper).pathname.split("/").pop();
  if (!id) return null;
  // The page is ~600 KB and the attributes sit near the end.
  const { html } = await fetchPage(`https://news.google.com/rss/articles/${id}`, {
    maxBytes: 2_000_000,
  });
  const signature = /data-n-a-sg="([^"]+)"/.exec(html)?.[1];
  const timestamp = /data-n-a-ts="([^"]+)"/.exec(html)?.[1];
  if (!signature || !timestamp) return null;

  const request = JSON.stringify([
    "garturlreq",
    [
      [
        "X",
        "X",
        ["X", "X"],
        null,
        null,
        1,
        1,
        "US:en",
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        0,
        1,
      ],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    id,
    Number(timestamp),
    signature,
  ]);
  const res = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `f.req=${encodeURIComponent(JSON.stringify([[["Fbv4je", request, null, "generic"]]]))}`,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  const payload = JSON.parse(text.split("\n\n")[1] ?? "null");
  const url = JSON.parse(payload?.[0]?.[2] ?? "null")?.[1];
  return typeof url === "string" && /^https?:\/\//.test(url) ? url : null;
}

// Mentions are keyed by the wrapper URL, so articles seen in an earlier run are skipped
// before the two-request decode.
export function googleNews(known: (wrapper: string) => boolean): Source {
  return async (since) => {
    const days = Math.max(1, Math.ceil((Date.now() - since.getTime()) / 86_400_000));
    const items = new Map<string, Item>();
    for (const query of queries) {
      const params = new URLSearchParams({
        q: `${query} when:${days}d`,
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      });
      const { html: xml } = await fetchPage(`https://news.google.com/rss/search?${params}`);
      for (const item of parseItems(xml)) {
        const wrapper = item.link.split("?")[0];
        if (wrapper.startsWith("https://news.google.com/") && looksLikePort(item.title)) {
          items.set(wrapper, item);
        }
      }
    }

    const mentions: Mention[] = [];
    for (const [wrapper, item] of items) {
      if (known(wrapper)) continue;
      const article = await resolveArticle(wrapper).catch(() => null);
      if (!article) continue;
      mentions.push({
        url: article,
        title: item.title,
        source: "googlenews",
        sourceRef: wrapper,
        seenAt: new Date(item.pubDate).toISOString(),
      });
    }
    return mentions;
  };
}
