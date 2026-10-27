import { z } from "zod";
import { genreIconNames, type GenreIconName } from "@/lib/genre-icons";

export const taxonomyKinds = ["platform", "genre"] as const;
export type TaxonomyKind = (typeof taxonomyKinds)[number];

const name = z.string().trim().min(1, "Required").max(60);

const slug = z
  .string()
  .trim()
  .min(1, "Required")
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

export const platformSchema = z.object({
  name,
  slug,
  short_name: z.string().trim().max(6, "Keep it to 6 characters"),
  color: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^#[0-9a-f]{6}$/, "Use a hex color like #ef4444"),
});

export const genreSchema = z.object({
  name,
  slug,
  icon: z.enum(genreIconNames as [GenreIconName, ...GenreIconName[]], {
    error: "Choose an icon",
  }),
});

export type PlatformInput = z.infer<typeof platformSchema>;
export type GenreInput = z.infer<typeof genreSchema>;
