import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { publicName } from "@/lib/public-name";
import { createClient } from "@/lib/supabase/server";

// Mirrors profiles_avatar_url_check, so token metadata can't point the header at any URL.
const providerAvatar =
  /^https:\/\/(cdn\.discordapp\.com\/(embed\/)?avatars\/|lh[0-9]+\.googleusercontent\.com\/a-?\/|avatars\.githubusercontent\.com\/u\/)/;

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Cached per request: the header, the page and its buttons all ask for the same user.
// A banned account counts as signed out right away; its access token can outlive the ban.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, role, created_at, banned_at")
    .eq("id", claims.sub)
    .single();
  if (!profile || profile.banned_at) return null;

  // A provider linked after sign-up (Google on an email account) leaves the profile empty;
  // the name and picture in the token fill the gaps.
  const meta = claims.user_metadata ?? {};
  const email = claims.email ?? null;
  const metaAvatar = text(meta.avatar_url);
  const fullName = text(meta.full_name) ?? text(meta.name);
  return {
    ...profile,
    email,
    name: profile.username ?? fullName ?? email?.split("@")[0] ?? "Player",
    publicName: publicName(profile.username ?? fullName),
    avatar:
      profile.avatar_url ?? (metaAvatar && providerAvatar.test(metaAvatar) ? metaAvatar : null),
    providers: claims.app_metadata?.providers ?? [],
  };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next = "/profile") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
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
