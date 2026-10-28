import { env } from "@/lib/env";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/database";
import { classify, fingerprint, type CheckResult, type Verdict } from "./lib/classify";
import { createScriptClient } from "./lib/db";
import { fetchPage, htmlToText, pageTitle } from "./lib/http";
import { notifyDiscord } from "./lib/notify";
import { revalidateSite } from "./lib/revalidate";

const CONCURRENCY = 4;
// A failed link gets a second try in the same run: two failures mark it broken the same day,
// one blip doesn't (docs/AUTOMATION.md review note).
const RETRY_AFTER_MS = 5 * 60_000;
const BROKEN_AFTER = 2;

const dryRun = process.argv.includes("--dry-run");

type Check = { result: CheckResult; verdict: Verdict; reason: string; print: string | null };

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function check(game: { play_url: string; page_title: string | null }): Promise<Check> {
  const started = Date.now();
  let result: CheckResult;
  let print: string | null = null;
  try {
    const page = await fetchPage(game.play_url, { maxBytes: 400_000 });
    const title = pageTitle(page.html);
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(page.html)?.[1];
    result = {
      status: page.status,
      finalUrl: page.url,
      ms: page.ms,
      title,
      h1: h1 ? htmlToText(h1).slice(0, 200) : null,
      challenge:
        /^(just a moment|attention required|access denied)/i.test(title ?? "") ||
        page.html.includes("/cdn-cgi/challenge-platform/"),
      error: null,
    };
    print = fingerprint(title, htmlToText(page.html));
  } catch (error) {
    result = {
      status: null,
      finalUrl: null,
      ms: Date.now() - started,
      title: null,
      h1: null,
      challenge: false,
      error: message(error).slice(0, 300),
    };
  }
  return {
    result,
    print,
    ...classify({ playUrl: game.play_url, pageTitle: game.page_title }, result),
  };
}

async function inBatches<T, R>(items: T[], run: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(items.slice(i, i + CONCURRENCY).map(run))));
  }
  return results;
}

async function main() {
  const db = createScriptClient();
  const [{ data: games, error }, recent] = await Promise.all([
    db
      .from("games")
      .select("id, slug, title, play_url, link_status, fail_streak, page_title")
      .eq("status", "published"),
    db
      .from("link_checks")
      .select("game_id, verdict")
      .gte("checked_at", new Date(Date.now() - 3 * 86_400_000).toISOString())
      .order("checked_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (recent.error) throw recent.error;
  // Alert on a verdict once, not every day it persists.
  const lastVerdict = new Map<string, string>();
  for (const { game_id, verdict } of recent.data) {
    if (!lastVerdict.has(game_id)) lastVerdict.set(game_id, verdict);
  }

  const checks = new Map(
    await inBatches(games, async (game) => [game.id, await check(game)] as const),
  );
  const failed = games.filter((game) => checks.get(game.id)?.verdict === "fail");
  const retried = new Set<string>();
  if (failed.length && !dryRun) {
    console.log(`${failed.length} failed; trying again in ${RETRY_AFTER_MS / 60_000} minutes.`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_MS));
    for (const [index, second] of (await inBatches(failed, check)).entries()) {
      checks.set(failed[index].id, second);
      retried.add(failed[index].id);
    }
  }

  const now = new Date().toISOString();
  const alerts: string[] = [];
  let publicChange = false;
  for (const game of games) {
    const { result, verdict, reason, print } = checks.get(game.id)!;
    const update: TablesUpdate<"games"> = { last_checked_at: now };
    // Public rows only ever get ok or broken (anon reads every column). slow, changed and
    // taken_down live in link_checks, where the admin sees them, until someone acts.
    let status: Enums<"link_status"> = game.link_status;
    const stored: Enums<"link_status"> = verdict === "fail" ? "broken" : verdict;

    if (verdict === "ok" || verdict === "slow") {
      status = "ok";
      Object.assign(update, {
        fail_streak: 0,
        last_ok_at: now,
        page_title: game.page_title ?? result.title,
        page_fingerprint: print,
      });
    } else if (verdict === "fail") {
      // Failing the first try and the retry counts as two failures.
      const streak = game.fail_streak + (retried.has(game.id) ? 2 : 1);
      update.fail_streak = streak;
      if (streak >= BROKEN_AFTER) status = "broken";
    } else if (verdict === "changed") {
      // Storing the new title flags a renamed page once; a redirect elsewhere stays flagged.
      update.page_title = result.title ?? game.page_title;
    }

    if (status !== game.link_status) {
      update.link_status = status;
      if (status === "broken" || game.link_status === "broken") publicChange = true;
    }
    const flagged = stored === "changed" || stored === "taken_down";
    if (
      (status !== game.link_status && (status === "broken" || game.link_status === "broken")) ||
      (flagged && lastVerdict.get(game.id) !== stored)
    ) {
      alerts.push(`**${game.title}**: ${stored} (${reason}) ${game.play_url}`);
    }

    console.log(
      `${verdict.padEnd(10)} ${game.slug} ${reason}${status !== game.link_status ? ` → ${status}` : ""}`,
    );
    if (dryRun) continue;

    const row: TablesInsert<"link_checks"> = {
      game_id: game.id,
      kind: "http",
      http_status: result.status,
      final_url: result.finalUrl && /^https?:\/\//.test(result.finalUrl) ? result.finalUrl : null,
      response_ms: result.ms,
      page_title: result.title?.slice(0, 300) ?? null,
      fingerprint: print,
      verdict: stored,
      error: result.error,
      details: { reason, retried: retried.has(game.id) },
    };
    const [inserted, updated] = await Promise.all([
      db.from("link_checks").insert(row),
      db.from("games").update(update).eq("id", game.id),
    ]);
    for (const { error: writeError } of [inserted, updated]) {
      if (writeError)
        console.warn(`Couldn't save the check for ${game.slug}: ${writeError.message}`);
    }
  }

  if (dryRun) return;
  if (alerts.length) {
    await notifyDiscord([
      "Link check:",
      ...alerts,
      new URL("/admin/games", env.NEXT_PUBLIC_SITE_URL).href,
    ]);
  }
  if (publicChange) await revalidateSite();
  console.log(`Checked ${games.length} games; ${alerts.length} status changes to review.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
