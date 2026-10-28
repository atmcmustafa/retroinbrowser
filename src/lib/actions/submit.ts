"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { normalizeUrl, urlKey } from "@/lib/normalize-url";
import { clientIp } from "@/lib/request-ip";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

type Values = { url: string; title: string; note: string };
type Field = keyof Values | "token";

export type SubmitState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<Field, string>>; values: Values }
  | { status: "error"; message: string; values: Values }
  | { status: "listed"; game: { slug: string; title: string } }
  | { status: "done"; known: boolean };

const submitSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste the link to the port.")
    .max(500)
    .pipe(z.url({ protocol: /^https?$/, error: "Enter a full link starting with https://" })),
  title: z.string().trim().max(120, "Keep it under 120 characters."),
  note: z.string().trim().max(500, "Keep it under 500 characters."),
  token: z.string().min(1, "Complete the check below.").max(2048),
});

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");

export async function submitGame(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const values = {
    url: text(formData.get("url")),
    title: text(formData.get("title")),
    note: text(formData.get("note")),
  };
  const parsed = submitSchema.safeParse({
    ...values,
    token: text(formData.get("cf-turnstile-response")),
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<Field, string>> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as Field] ??= issue.message;
    return { status: "invalid", fieldErrors, values };
  }

  const ip = clientIp(await headers());
  if (!(await verifyTurnstile(parsed.data.token, "submit", ip))) {
    return { status: "error", message: "The check expired or failed. Try again.", values };
  }

  const url = normalizeUrl(parsed.data.url);
  const host = url ? new URL(url).hostname : null;
  if (!url || !host || host === new URL(env.NEXT_PUBLIC_SITE_URL).hostname) {
    return {
      status: "invalid",
      fieldErrors: { url: "Enter the link to the port itself." },
      values,
    };
  }

  // Only reachable after Turnstile: anonymous visitors can't write candidates under RLS.
  const admin = createAdminClient();

  const { data: games, error: gamesError } = await admin
    .from("games")
    .select("slug, title, status, play_url")
    .ilike("play_url", `%${host}%`)
    .limit(50);
  if (gamesError) console.error("Checking listed games failed", gamesError);
  const key = urlKey(url);
  const listed = games?.find((game) => {
    const playUrl = normalizeUrl(game.play_url);
    return playUrl !== null && urlKey(playUrl) === key;
  });
  if (listed?.status === "published") {
    return { status: "listed", game: { slug: listed.slug, title: listed.title } };
  }
  if (listed) return { status: "done", known: true };

  const { count: known } = await admin
    .from("candidates")
    .select("id", { count: "exact", head: true })
    .in("url", [`https://${key}`, `http://${key}`]);
  if (known) return { status: "done", known: true };

  const user = await getCurrentUser();
  const { error } = await admin.from("candidates").insert({
    url,
    title: parsed.data.title || null,
    note: parsed.data.note || null,
    source: "user",
    submitted_by: user?.id ?? null,
  });
  if (error?.code === "23505") return { status: "done", known: true };
  if (error) {
    console.error("Saving submission failed", error);
    return { status: "error", message: "Couldn't save your submission. Try again later.", values };
  }

  return { status: "done", known: false };
}
