import { normalizeUrl, urlKey } from "@/lib/normalize-url";
import { createScriptClient } from "./lib/db";
import { scoreMentions } from "./lib/score";
import { github } from "./sources/github";
import { googleNews } from "./sources/googlenews";
import { hackerNews } from "./sources/hackernews";
import { reddit } from "./sources/reddit";
import type { Mention, Source } from "./sources/types";

// Runs every few hours; a longer window only re-reads mentions that are already stored.
// `npm run collect -- --days 30` backfills.
const LOOKBACK_DAYS = 3;
const SCORE_DAYS = 7;

function lookbackDays() {
  const flag = process.argv.indexOf("--days");
  const days = flag === -1 ? NaN : Number(process.argv[flag + 1]);
  return Number.isInteger(days) && days > 0 ? days : LOOKBACK_DAYS;
}

// Never a port page: social and video sites, link aggregators, and other port directories
// (docs/AUTOMATION.md: discovery comes from primary sources, not competitors' lists).
const skipHost =
  /(^|\.)(youtube\.com|youtu\.be|twitter\.com|x\.com|facebook\.com|instagram\.com|tiktok\.com|linkedin\.com|discord\.gg|discord\.com|t\.me|news\.ycombinator\.com|reddit\.com|portedgames\.com|recompiledgames\.com|retroinbrowser\.com)$/i;

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  const db = createScriptClient();
  const since = new Date(Date.now() - lookbackDays() * 86_400_000);

  // These tables stay small, so dedup works from memory.
  const [candidates, mentions, games] = await Promise.all([
    db.from("candidates").select("id, url"),
    db.from("candidate_mentions").select("candidate_id, url"),
    db.from("games").select("id, play_url, source_url"),
  ]);
  for (const result of [candidates, mentions, games]) if (result.error) throw result.error;

  const candidateByKey = new Map<string, string>();
  for (const { id, url } of candidates.data ?? []) {
    const normalized = normalizeUrl(url);
    if (normalized) candidateByKey.set(urlKey(normalized), id);
  }
  const candidateByMention = new Map(
    (mentions.data ?? []).map(({ url, candidate_id }) => [url, candidate_id]),
  );
  const gameByKey = new Map<string, string>();
  for (const game of games.data ?? []) {
    for (const url of [game.play_url, game.source_url]) {
      const normalized = url && normalizeUrl(url);
      if (normalized) gameByKey.set(urlKey(normalized), game.id);
    }
  }

  const sources: [string, Source][] = [
    ["Hacker News", hackerNews],
    ["GitHub", github],
    ["Reddit", reddit],
    ["Google News", googleNews((wrapper) => candidateByMention.has(wrapper))],
  ];
  const found = new Map<string, Mention>();
  for (const [name, source] of sources) {
    try {
      const list = await source(since);
      for (const mention of list) found.set(mention.sourceRef, mention);
      console.log(`${name}: ${list.length} mentions`);
    } catch (error) {
      console.warn(`${name} failed: ${message(error)}`);
    }
  }

  let created = 0;
  const touched = new Set<string>();
  for (const mention of found.values()) {
    const url = normalizeUrl(mention.url);
    if (!url || skipHost.test(new URL(url).hostname)) continue;
    const key = urlKey(url);
    const title = mention.title.slice(0, 300);

    let candidateId = candidateByMention.get(mention.sourceRef) ?? candidateByKey.get(key);
    if (!candidateId) {
      const gameId = gameByKey.get(key) ?? null;
      const { data, error } = await db
        .from("candidates")
        .insert({
          url,
          title,
          source: mention.source,
          source_ref: mention.sourceRef,
          // Mentions of listed games are kept for their trend, outside the review queue.
          status: gameId ? "duplicate" : "pending",
          game_id: gameId,
          first_seen_at: mention.seenAt,
        })
        .select("id")
        .single();
      if (error) {
        console.warn(`Couldn't add ${url}: ${error.message}`);
        continue;
      }
      candidateId = data.id;
      candidateByKey.set(key, candidateId);
      created++;
    }

    const { error } = await db.from("candidate_mentions").upsert(
      {
        candidate_id: candidateId,
        source: mention.source,
        url: mention.sourceRef,
        title,
        points: mention.points ?? null,
        seen_at: mention.seenAt,
      },
      { onConflict: "candidate_id,url" },
    );
    if (error) console.warn(`Couldn't record mention ${mention.sourceRef}: ${error.message}`);
    candidateByMention.set(mention.sourceRef, candidateId);
    touched.add(candidateId);
  }

  if (touched.size) {
    const { error } = await db
      .from("candidates")
      .update({ last_seen_at: new Date().toISOString() })
      .in("id", [...touched]);
    if (error) console.warn(`Couldn't update last_seen_at: ${error.message}`);
  }

  const scored = await updateScores(db);
  console.log(`${found.size} mentions, ${created} new candidates, ${scored} scores updated.`);
}

async function updateScores(db: ReturnType<typeof createScriptClient>) {
  const cutoff = Date.now() - SCORE_DAYS * 86_400_000;
  const { data, error } = await db
    .from("candidates")
    .select("id, score, candidate_mentions(source, title, points, seen_at)")
    .eq("status", "pending");
  if (error) throw error;

  let updated = 0;
  for (const candidate of data) {
    const recent = candidate.candidate_mentions.filter(
      ({ seen_at }) => new Date(seen_at).getTime() >= cutoff,
    );
    const score = Math.round(scoreMentions(recent) * 100) / 100;
    if (score === candidate.score) continue;
    const { error: updateError } = await db
      .from("candidates")
      .update({ score })
      .eq("id", candidate.id);
    if (updateError) console.warn(`Couldn't score ${candidate.id}: ${updateError.message}`);
    else updated++;
  }
  return updated;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
