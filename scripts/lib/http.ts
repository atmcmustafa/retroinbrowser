export const USER_AGENT = "RetroInBrowserBot/1.0 (+https://retroinbrowser.com/about)";

export type Page = { status: number; url: string; html: string; ms: number; contentType: string };

// Reads at most maxBytes so a huge page or a download link can't stall a run.
export async function fetchPage(
  url: string,
  { timeoutMs = 15_000, maxBytes = 1_500_000 }: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<Page> {
  const started = Date.now();
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = res.body?.getReader();
  while (reader && size < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader?.cancel().catch(() => {});

  return {
    status: res.status,
    url: res.url || url,
    html: Buffer.concat(chunks).toString("utf8"),
    ms: Date.now() - started,
    contentType: res.headers.get("content-type") ?? "",
  };
}

export async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return (await res.json()) as T;
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const point =
        code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(point) ? String.fromCodePoint(point) : match;
    }
    return entities[code.toLowerCase()] ?? match;
  });
}

export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr|\/section|\/article)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function attribute(tag: string, name: string) {
  const match = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return match ? decodeEntities(match[2] ?? match[3] ?? match[4] ?? "") : null;
}

export function pageTitle(html: string) {
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  return title ? decodeEntities(title).replace(/\s+/g, " ").trim() : null;
}

export function metaContent(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = attribute(tag, "property") ?? attribute(tag, "name");
    if (name?.toLowerCase() === key.toLowerCase()) return attribute(tag, "content");
  }
  return null;
}

// Links in the page with their text, resolved against the page URL. Articles about a port
// usually link to it; the extractor picks the right one from this list.
export function pageLinks(html: string, base: string, limit = 120) {
  const links = new Map<string, string>();
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attribute(match[1], "href");
    if (!href) continue;
    const url = URL.parse(href, base);
    if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) continue;
    url.hash = "";
    const text = htmlToText(match[2]).slice(0, 80);
    if (!links.has(url.href)) links.set(url.href, text);
    if (links.size >= limit) break;
  }
  return [...links].map(([url, text]) => ({ url, text }));
}
