import { findCommentProblem } from "@/lib/moderation";

// Shown next to comments: never the email, and a full name only as "Ada L.". Sign-up copies a
// Google name into the username when there is no handle (handle_new_user), so usernames are
// shortened too; GitHub and Discord handles have no spaces and come through unchanged. Usernames
// are chosen freely, so one that fails the comment filter shows as "Player". The name is cut by
// code point and cleared of invisible characters, which comments_author_name_check rejects.
export function publicName(name: string | null) {
  const visible = name?.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "").trim();
  const [first, ...rest] = visible ? visible.split(/\s+/) : [];
  if (!first) return "Player";
  const initial = [...(rest.at(-1) ?? "")][0]?.toUpperCase();
  const shown = [...(initial ? `${first} ${initial}.` : first)].slice(0, 40).join("").trimEnd();
  return findCommentProblem(shown) ? "Player" : shown;
}
