import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, role")
    .eq("id", claims.sub)
    .single();

  return profile && { ...profile, email: claims.email ?? null };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") notFound();
  return user;
}

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
