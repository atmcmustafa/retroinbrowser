"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  genreSchema,
  platformSchema,
  taxonomyKinds,
  type GenreInput,
  type PlatformInput,
  type TaxonomyKind,
} from "@/lib/schemas/taxonomy";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
type FieldErrors<T> = Partial<Record<keyof T, string>>;
type DbError = { code: string; message: string };

export type SaveTaxonomyResult<T> =
  { ok: true } | { ok: false; message: string; fieldErrors?: FieldErrors<T> };

export type TaxonomyResult = { ok: true } | { ok: false; message: string };

const idSchema = z.number().int().positive();
const itemSchema = z.object({ kind: z.enum(taxonomyKinds), id: idSchema });
const moveSchema = itemSchema.extend({ direction: z.enum(["up", "down"]) });

// Game cards embed platform name and color, so taxonomy edits invalidate game caches too.
function invalidate() {
  updateTag("taxonomy");
  updateTag("games");
}

function fieldErrorsOf<T>(error: z.ZodError<T>) {
  const fieldErrors: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}

function failedSave<T>(error: DbError, constraint: string, label: string): SaveTaxonomyResult<T> {
  if (error.code === "23505" && error.message.includes(constraint)) {
    const message = `Another ${label} already uses this slug.`;
    return { ok: false, message, fieldErrors: { slug: message } as FieldErrors<T> };
  }
  if (error.code === "PGRST116") return { ok: false, message: `Unknown ${label}.` };
  console.error(`Saving ${label} failed`, error);
  return { ok: false, message: `Couldn't save the ${label}.` };
}

async function orderedRows(supabase: Client, kind: TaxonomyKind) {
  return kind === "platform"
    ? await supabase.from("platforms").select("id, sort").order("sort").order("name")
    : await supabase.from("genres").select("id, sort").order("sort").order("name");
}

async function nextSort(supabase: Client, kind: TaxonomyKind) {
  const { data, error } = await orderedRows(supabase, kind);
  if (error) {
    console.error("Loading order failed", error);
    return null;
  }
  return Math.max(0, ...data.map((row) => row.sort)) + 1;
}

export async function savePlatform(
  id: number | null,
  input: PlatformInput,
): Promise<SaveTaxonomyResult<PlatformInput>> {
  await requireAdmin();
  if (id !== null && !idSchema.safeParse(id).success) {
    return { ok: false, message: "Unknown platform." };
  }
  const parsed = platformSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createClient();
  const row = { ...parsed.data, short_name: parsed.data.short_name || null };
  const sort = id ? null : await nextSort(supabase, "platform");
  if (!id && sort === null) return { ok: false, message: "Couldn't save the platform." };

  const { error } = id
    ? await supabase.from("platforms").update(row).eq("id", id).select("id").single()
    : await supabase
        .from("platforms")
        .insert({ ...row, sort: sort ?? undefined })
        .select("id")
        .single();
  if (error) return failedSave(error, "platforms_slug_key", "platform");

  invalidate();
  return { ok: true };
}

export async function saveGenre(
  id: number | null,
  input: GenreInput,
): Promise<SaveTaxonomyResult<GenreInput>> {
  await requireAdmin();
  if (id !== null && !idSchema.safeParse(id).success) {
    return { ok: false, message: "Unknown genre." };
  }
  const parsed = genreSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createClient();
  const sort = id ? null : await nextSort(supabase, "genre");
  if (!id && sort === null) return { ok: false, message: "Couldn't save the genre." };

  const { error } = id
    ? await supabase.from("genres").update(parsed.data).eq("id", id).select("id").single()
    : await supabase
        .from("genres")
        .insert({ ...parsed.data, sort: sort ?? undefined })
        .select("id")
        .single();
  if (error) return failedSave(error, "genres_slug_key", "genre");

  invalidate();
  return { ok: true };
}

export async function moveTaxonomyItem(
  kind: TaxonomyKind,
  id: number,
  direction: "up" | "down",
): Promise<TaxonomyResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse({ kind, id, direction });
  if (!parsed.success) return { ok: false, message: "Unknown item." };

  const supabase = await createClient();
  const { data: rows, error } = await orderedRows(supabase, parsed.data.kind);
  if (error) {
    console.error("Loading order failed", error);
    return { ok: false, message: "Couldn't reorder. Try again." };
  }

  const index = rows.findIndex((row) => row.id === parsed.data.id);
  const target = index + (parsed.data.direction === "up" ? -1 : 1);
  if (index < 0 || target < 0 || target >= rows.length) {
    return { ok: false, message: "Can't move that item." };
  }
  [rows[index], rows[target]] = [rows[target], rows[index]];

  // Renumber 1..n so gaps or duplicate sort values from manual edits can't block a swap.
  const updates = rows.flatMap((row, position) =>
    row.sort === position + 1 ? [] : [{ id: row.id, sort: position + 1 }],
  );
  const results = await Promise.all(
    updates.map(({ id: rowId, sort }) =>
      parsed.data.kind === "platform"
        ? supabase.from("platforms").update({ sort }).eq("id", rowId)
        : supabase.from("genres").update({ sort }).eq("id", rowId),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) {
    console.error("Reordering failed", failed.error);
    return { ok: false, message: "Couldn't reorder. Refresh and try again." };
  }

  invalidate();
  return { ok: true };
}

export async function deleteTaxonomyItem(kind: TaxonomyKind, id: number): Promise<TaxonomyResult> {
  await requireAdmin();
  const parsed = itemSchema.safeParse({ kind, id });
  if (!parsed.success) return { ok: false, message: "Unknown item." };

  const supabase = await createClient();
  const usage =
    parsed.data.kind === "platform"
      ? await supabase
          .from("games")
          .select("id", { count: "exact", head: true })
          .eq("platform_id", parsed.data.id)
      : await supabase
          .from("game_genres")
          .select("game_id", { count: "exact", head: true })
          .eq("genre_id", parsed.data.id);
  if (usage.error) {
    console.error("Checking usage failed", usage.error);
    return { ok: false, message: "Couldn't delete. Try again." };
  }
  if (usage.count) {
    return {
      ok: false,
      message: `Used by ${usage.count} ${usage.count === 1 ? "game" : "games"}. Move them first.`,
    };
  }

  const { error } =
    parsed.data.kind === "platform"
      ? await supabase.from("platforms").delete().eq("id", parsed.data.id)
      : await supabase.from("genres").delete().eq("id", parsed.data.id);
  if (error) {
    console.error("Deleting taxonomy item failed", error);
    return { ok: false, message: "Couldn't delete. Try again." };
  }

  invalidate();
  return { ok: true };
}
