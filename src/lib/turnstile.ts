import "server-only";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

type SiteverifyResult = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

// Fails closed: a missing secret, a network error or a mismatch all count as "not verified".
export async function verifyTurnstile(token: string, action: string, remoteip?: string) {
  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set; rejecting submission");
    return false;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(remoteip && { remoteip }) }),
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await res.json()) as SiteverifyResult;
    if (!result.success) {
      console.warn("Turnstile rejected a token", result["error-codes"]);
      return false;
    }
    // Cloudflare's test secrets (1x000…AA) report "example.com" and no action; real widgets
    // report both, and only our own hostname counts for them.
    const expectedHost = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;
    const testHost = /^[123]x0+AA$/.test(secret) && result.hostname === "example.com";
    if (result.hostname !== expectedHost && !testHost) return false;
    if (result.action && result.action !== action) return false;
    return true;
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}
