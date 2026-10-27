"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReviewStatus = "rejected" | "duplicate" | "pending";

export type CandidateStatusResult = { ok: true; count: number } | { ok: false; message: string };

const statusSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
  status: z.enum(["rejected", "duplicate", "pending"]),
});

export async function setCandidateStatus(
  ids: string[],
  status: ReviewStatus,
): Promise<CandidateStatusResult> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse({ ids, status });
  if (!parsed.success) return { ok: false, message: "Select at least one candidate." };

  const review =
    parsed.data.status === "pending"
      ? { reviewed_at: null, reviewed_by: null }
      : { reviewed_at: new Date().toISOString(), reviewed_by: admin.id };

  const supabase = await createClient();
  // Approved candidates are tied to a game; leave them alone even if selected.
  const { data, error } = await supabase
    .from("candidates")
    .update({ status: parsed.data.status, ...review })
    .in("id", parsed.data.ids)
    .neq("status", "approved")
    .select("id");
  if (error) {
    console.error("Updating candidates failed", error);
    return { ok: false, message: "Couldn't update the candidates." };
  }

  refresh();
  return { ok: true, count: data.length };
}
