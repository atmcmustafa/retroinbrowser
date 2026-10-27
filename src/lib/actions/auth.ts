"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" | "sent"; email: string }
  | { status: "invalid" | "error"; email: string; message: string };

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  next: z.string().max(512).optional(),
});

const sendErrors: Record<string, string> = {
  over_email_send_rate_limit: "Too many emails sent. Try again in a few minutes.",
  over_request_rate_limit: "Too many attempts. Try again in a few minutes.",
  email_address_not_authorized: "Sign-in isn't open to everyone yet.",
};

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "invalid", email, message: "Enter a valid email address." };
  }

  const callback = new URL("/auth/callback", env.NEXT_PUBLIC_SITE_URL);
  const next = safeNextPath(parsed.data.next);
  if (next !== "/") callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callback.href },
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
