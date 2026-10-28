"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth";
import { oauthProviders } from "@/lib/auth-providers";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" | "sent"; email: string }
  | { status: "invalid" | "error"; email: string; message: string };

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  next: z.string().max(512).optional(),
  captchaToken: z.string().max(2048).optional(),
});

const providerSchema = z.object({
  provider: z.enum(oauthProviders),
  next: z.string().max(512).optional(),
});

const sendErrors: Record<string, string> = {
  over_email_send_rate_limit: "Too many emails sent. Try again in a few minutes.",
  over_request_rate_limit: "Too many attempts. Try again in a few minutes.",
  email_address_not_authorized: "Sign-in isn't open to everyone yet.",
  captcha_failed: "The security check failed. Reload the page and try again.",
};

function callbackUrl(next: string | undefined) {
  const callback = new URL("/auth/callback", env.NEXT_PUBLIC_SITE_URL);
  const path = safeNextPath(next);
  if (path !== "/") callback.searchParams.set("next", path);
  return callback.href;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    next: formData.get("next") ?? undefined,
    captchaToken: formData.get("cf-turnstile-response") || undefined,
  });
  if (!parsed.success) {
    return { status: "invalid", email, message: "Enter a valid email address." };
  }

  // Supabase Auth checks the Turnstile token itself when CAPTCHA protection is on, which also
  // covers calls made straight to its API with the public key.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl(parsed.data.next),
      captchaToken: parsed.data.captchaToken,
    },
  });

  if (error) {
    const known = error.code ? sendErrors[error.code] : undefined;
    if (!known) console.error("signInWithOtp failed", error);
    return {
      status: "error",
      email,
      message: known ?? "Couldn't send the link. Try again later.",
    };
  }

  return { status: "sent", email: parsed.data.email };
}

export async function signInWithProvider(formData: FormData) {
  const parsed = providerSchema.safeParse({
    provider: formData.get("provider"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) redirect("/login");

  // Stores the PKCE verifier in a cookie; /auth/callback needs it to finish the sign-in.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: { redirectTo: callbackUrl(parsed.data.next) },
  });
  if (error || !data.url) {
    console.error("signInWithOAuth failed", parsed.data.provider, error);
    redirect("/login?error=failed");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
