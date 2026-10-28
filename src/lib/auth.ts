import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Mirrors profiles_avatar_url_check, so token metadata can't point the header at any URL.
const providerAvatar =
  /^https:\/\/(cdn\.discordapp\.com\/(embed\/)?avatars\/|lh[0-9]+\.googleusercontent\.com\/a-?\/|avatars\.githubusercontent\.com\/u\/)/;

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Shown next to comments: never the email, and a full name only as "Ada L.". Sign-up copies a
// Google name into the username when there is no handle (handle_new_user), so usernames are
// shortened too; GitHub and Discord handles have no spaces and come through unchanged.
function publicName(name: string | null) {
  const [first, ...rest] = name?.split(/\s+/) ?? [];
  if (!first) return "Player";
  const initial = [...(rest.at(-1) ?? "")][0]?.toUpperCase();
  return (initial ? `${first} ${initial}.` : first).slice(0, 40).trimEnd();
}

// Cached per request: the header, the page and its buttons all ask for the same user.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, role, created_at")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

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
