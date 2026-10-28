type Platform = { slug: string; name: string; short_name: string | null };

// The platform is where the game first came out, not where it runs: every port plays in the
// browser. "other" collects systems without a page of their own (Mac, PS3). Narrow cards pass
// short to get "PS2" for long names.
export function originalPlatform({ slug, name, short_name }: Platform, short = false) {
  if (slug === "other") return "another system";
  return short && name.length > 8 && short_name ? short_name : name;
}
