type ScoredMention = { source: string; title: string | null; points: number | null };

// Google News titles end in " - Publisher".
function publisher(title: string | null) {
  const parts = (title ?? "").split(" - ");
  return (parts.length > 1 ? parts[parts.length - 1] : (title ?? "")).trim().toLowerCase();
}

// docs/AUTOMATION.md: Hacker News stories weigh most, then distinct news outlets. Points,
// upvotes and stars count on a log scale so one huge thread can't drown the rest.
export function scoreMentions(mentions: ScoredMention[]) {
  let stories = 0;
  let hnPoints = 0;
  let upvotes = 0;
  let stars = 0;
  const outlets = new Set<string>();
  for (const mention of mentions) {
    const points = Math.max(0, mention.points ?? 0);
    if (mention.source === "hackernews") {
      stories++;
      hnPoints += points;
    } else if (mention.source === "googlenews") {
      outlets.add(publisher(mention.title));
    } else if (mention.source === "reddit") {
      upvotes += points;
    } else if (mention.source === "github") {
      stars = Math.max(stars, points);
    }
  }
  return (
    3 * stories +
    Math.log10(1 + hnPoints) +
    2 * outlets.size +
    Math.log10(1 + upvotes) +
    Math.log10(1 + stars)
  );
}
