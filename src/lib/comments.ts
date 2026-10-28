// Mirrors comments_tags_check and comments_body_check
// (supabase/migrations/20261028194845_comments_open.sql).
export const commentTags = {
  works: "Works",
  not_working: "Doesn't work",
  great: "Great port",
  works_on_phone: "Works on phone",
  controller_works: "Controller works",
  laggy: "Laggy",
  buggy: "Buggy",
} as const;

export type CommentTag = keyof typeof commentTags;

export const commentTagKeys = Object.keys(commentTags) as [CommentTag, ...CommentTag[]];

export const COMMENT_MAX_LENGTH = 500;
export const COMMENT_MAX_TAGS = 3;

// "Works" and "Doesn't work" contradict each other, so picking one drops the other.
export function toggleTag(tags: CommentTag[], tag: CommentTag): CommentTag[] {
  if (tags.includes(tag)) return tags.filter((t) => t !== tag);
  if (tags.length >= COMMENT_MAX_TAGS) return tags;
  const opposite = tag === "works" ? "not_working" : tag === "not_working" ? "works" : null;
  return [...tags.filter((t) => t !== opposite), tag];
}
