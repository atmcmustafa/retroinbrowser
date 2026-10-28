import "server-only";

// Vercel overwrites x-forwarded-for with the address it saw, so the first entry can't be spoofed there.
export function clientIp(headers: Pick<Headers, "get">) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}
