import { serverEnv } from "@/lib/env.server";

// Optional: without DISCORD_WEBHOOK_URL new candidates only show up in /admin/candidates.
export async function notifyDiscord(lines: string[]) {
  const webhook = serverEnv.DISCORD_WEBHOOK_URL;
  if (!webhook || lines.length === 0) return;
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: lines.join("\n").slice(0, 1900),
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.warn(`Discord answered ${res.status}`);
  } catch (error) {
    console.warn("Discord notification failed", error);
  }
}
