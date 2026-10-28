import { createHash } from "node:crypto";

export type CheckResult = {
  status: number | null;
  finalUrl: string | null;
  ms: number;
  title: string | null;
  h1: string | null;
  // Bot challenge pages (Cloudflare and the like) say nothing about whether the port works.
  challenge: boolean;
  error: string | null;
};

export type Verdict = "ok" | "slow" | "fail" | "changed" | "taken_down" | "unknown";

const SLOW_MS = 8_000;
// Matched against the title and first heading only: footers everywhere link to a "DMCA" page.
const legalNotice =
  /\b(dmca|taken down|takedown notice|cease and desist|unavailable for legal reasons|copyright (claim|notice|infringement))\b/i;
const parked =
  /\b(domain (is )?for sale|buy this domain|parked (free|domain)|this domain (has expired|is parked|may be for sale))\b/i;

// Registrable part, roughly: a port moving from www to app on the same domain isn't a change.
function siteOf(url: string) {
  const host = URL.parse(url)?.hostname.toLowerCase() ?? "";
  return host.split(".").slice(-2).join(".");
}

function words(text: string) {
  return new Set(text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
}

function sharesWords(a: string, b: string) {
  const left = words(a);
  if (left.size === 0) return true;
  return [...words(b)].some((word) => left.has(word));
}

// docs/AUTOMATION.md decision table. "fail" is counted by the caller (fail_streak); the
// "changed" decision rests on the domain and title, never on page text, since WebAssembly
// ports often show nothing but "Loading".
export function classify(
  known: { playUrl: string; pageTitle: string | null },
  result: CheckResult,
): { verdict: Verdict; reason: string } {
  if (result.status === 451) return { verdict: "taken_down", reason: "HTTP 451" };
  if (result.challenge) return { verdict: "unknown", reason: "bot challenge page" };
  if (result.status === null || result.status >= 400) {
    return { verdict: "fail", reason: result.error ?? `HTTP ${result.status}` };
  }

  const heading = `${result.title ?? ""} ${result.h1 ?? ""}`;
  if (legalNotice.test(heading))
    return { verdict: "taken_down", reason: "takedown notice on the page" };
  if (parked.test(heading)) return { verdict: "changed", reason: "parked domain" };
  if (result.finalUrl && siteOf(result.finalUrl) !== siteOf(known.playUrl)) {
    return { verdict: "changed", reason: `redirects to ${URL.parse(result.finalUrl)?.hostname}` };
  }
  if (known.pageTitle && result.title && !sharesWords(known.pageTitle, result.title)) {
    return { verdict: "changed", reason: `title is now "${result.title}"` };
  }
  if (result.ms > SLOW_MS) return { verdict: "slow", reason: `${Math.round(result.ms / 1000)} s` };
  return { verdict: "ok", reason: "ok" };
}

export function fingerprint(title: string | null, text: string) {
  const normalized = `${title ?? ""}\n${text}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2048);
  return createHash("sha256").update(normalized).digest("hex");
}
