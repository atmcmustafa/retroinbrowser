const trackingParam = /^(utm_.+|ref|fbclid|gclid|mc_cid|mc_eid)$/i;

// One canonical form per port, so the same link shared two ways is caught as a duplicate.
// Hash is dropped: ports here don't route by fragment, and shared links often carry anchors.
export function normalizeUrl(input: string): string | null {
  const url = URL.parse(input.trim());
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return null;

  const host = url.host.replace(/^www\./, "");
  for (const key of [...url.searchParams.keys()]) {
    if (trackingParam.test(key)) url.searchParams.delete(key);
  }
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${host}${path}${url.search}`;
}

// Duplicate checks ignore the scheme: the same port is often shared as http and https.
// The stored URL keeps the scheme it was sent with, in case a port really is http-only.
export function urlKey(normalized: string) {
  return normalized.replace(/^https?:\/\//, "");
}
