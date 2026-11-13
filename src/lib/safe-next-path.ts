// Resolving against a fixed origin catches "//host", "/\host" and tab/newline tricks
// that browsers would otherwise follow off-site.
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const base = "http://localhost";
  const url = URL.parse(value, base);
  if (!url || url.origin !== base) return "/";
  const path = url.pathname + url.search + url.hash;
  return path.startsWith("//") ? "/" : path;
}
