"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { publicName } from "@/lib/public-name";
import { createAdminClient } from "@/lib/supabase/server";

// /admin/users. Accounts live in Supabase Auth, so everything here needs the secret key; each
// action checks for an admin first.

export type UserActionResult = { ok: true } | { ok: false; message: string };

type AdminClient = ReturnType<typeof createAdminClient>;

// Auth takes a Go duration; this outlasts any account.
const FOREVER = "876000h";

// Close to profiles_username_check, a little stricter: controls, format characters (zero-width,
// direction overrides) and line separators.
const usernameSchema = z
  .string()
  .trim()
  .min(1, "Enter a username.")
  .max(32, "Keep it to 32 characters.")
  .refine((name) => !/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(name), {
    error: "Remove invisible or direction-changing characters.",
  });

const idSchema = z.uuid();

// Bans and deletions stop at admins, including the one asking.
async function checkTarget(admin: AdminClient, id: string, myId: string) {
  if (id === myId) return "You can't do that to your own account.";
  const { data, error } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
  if (error) {
    console.error("Loading an account failed", error);
    return "Couldn't load that account. Try again.";
  }
  if (!data) return "That account is gone.";
  if (data.role === "admin") return "Admins can't be banned or deleted here.";
  return null;
}

export async function renameUser(id: string, username: string): Promise<UserActionResult> {
  await requireAdmin();
  const parsed = z.object({ id: idSchema, username: usernameSchema }).safeParse({ id, username });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the username." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ username: parsed.data.username })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { ok: false, message: "That username is taken." };
    if (error.code === "23514") return { ok: false, message: "That username isn't allowed." };
    console.error("Renaming a user failed", error);
    return { ok: false, message: "Couldn't rename the account. Try again." };
  }
  if (!data) return { ok: false, message: "That account is gone." };

  // Comments keep the name they were posted under, and a rename is usually about that name.
  const { error: commentsError } = await admin
    .from("comments")
    .update({ author_name: publicName(parsed.data.username) })
    .eq("user_id", parsed.data.id);
  updateTag("comments");
  if (commentsError) {
    console.error("Renaming a user's comments failed", commentsError);
    return { ok: false, message: "Renamed, but their comments still show the old name." };
  }
  return { ok: true };
}

const banSchema = z.object({
  id: idSchema,
  reason: z.string().trim().max(200, "Keep the reason to 200 characters."),
  deleteComments: z.boolean(),
});

export async function banUser(input: {
  id: string;
  reason: string;
  deleteComments: boolean;
}): Promise<UserActionResult> {
  const me = await requireAdmin();
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the ban." };
  }
  const { id, reason, deleteComments } = parsed.data;

  const admin = createAdminClient();
  const problem = await checkTarget(admin, id, me.id);
  if (problem) return { ok: false, message: problem };

  // The profile flag works at once (getCurrentUser); the Auth ban stops new sign-ins and
  // token refreshes, so the account can't come back after its current token expires.
  const now = new Date().toISOString();
  const { error } = await admin
    .from("profiles")
    .update({ banned_at: now, ban_reason: reason || null })
    .eq("id", id);
  if (error) {
    console.error("Banning a user failed", error);
    return { ok: false, message: "Couldn't ban the account. Try again." };
  }

  let commentsFailed = false;
  if (deleteComments) {
    const { error: commentsError } = await admin
      .from("comments")
      .update({ deleted_at: now, deleted_by: "admin" })
      .eq("user_id", id)
      .is("deleted_at", null);
    if (commentsError) {
      console.error("Deleting a banned user's comments failed", commentsError);
      commentsFailed = true;
    }
  }
  updateTag("comments");

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: FOREVER,
  });
  if (authError) {
    console.error("Banning a user in Auth failed", authError);
    return {
      ok: false,
      message: "Banned on the site, but Supabase Auth didn't take the ban. Ban them again.",
    };
  }
  if (commentsFailed) {
    return {
      ok: false,
      message: "Banned, but their comments are still up. Delete them in Comments.",
    };
  }
  return { ok: true };
}

export async function unbanUser(id: string): Promise<UserActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown account." };

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(parsed.data, {
    ban_duration: "none",
  });
  if (authError) {
    console.error("Lifting an Auth ban failed", authError);
    return { ok: false, message: "Couldn't lift the ban. Try again." };
  }
  const { error } = await admin
    .from("profiles")
    .update({ banned_at: null, ban_reason: null })
    .eq("id", parsed.data);
  if (error) {
    console.error("Unbanning a user failed", error);
    return { ok: false, message: "Couldn't lift the ban. Try again." };
  }
  refresh();
  return { ok: true };
}

// Deleting the Auth user cascades to the profile, comments, favorites and play history.
export async function deleteUser(id: string): Promise<UserActionResult> {
  const me = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown account." };

  const admin = createAdminClient();
  const problem = await checkTarget(admin, parsed.data, me.id);
  if (problem) return { ok: false, message: problem };

  const { error } = await admin.auth.admin.deleteUser(parsed.data);
  if (error) {
    console.error("Deleting a user failed", error);
    return { ok: false, message: "Couldn't delete the account. Try again." };
  }
  updateTag("comments");
  return { ok: true };
}
