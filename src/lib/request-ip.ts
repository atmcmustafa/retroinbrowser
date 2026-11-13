import "server-only";

// Cloudflare sets cf-connecting-ip to the address it saw. It appends to x-forwarded-for instead,
// so that header's first entry is whatever the client sent; it's only the local fallback.
export function clientIp(headers: Pick<Headers, "get">) {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined
  );
}
