import { z } from "zod";

// What scripts/extract.ts stores in candidates.extracted. The admin reads it back with
// safeParse: it came from an LLM reading an untrusted page, so every field is a suggestion.
export const extractedSchema = z.object({
  is_port: z.boolean(),
  // Missing on extractions made before it existed.
  available: z.boolean().nullable().optional(),
  confidence: z.number(),
  reason: z.string(),
  title: z.string().nullable(),
  original_title: z.string().nullable(),
  platform_slug: z.string().nullable(),
  genre_slugs: z.array(z.string()),
  play_url: z.string().nullable(),
  source_url: z.string().nullable(),
  developer: z.string().nullable(),
  tech: z.string().nullable(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  requires_own_files: z.boolean().nullable(),
  mobile_support: z.boolean().nullable(),
  gamepad_support: z.boolean().nullable(),
  artwork: z
    .object({
      steamgriddb_id: z.number(),
      name: z.string(),
      cover_url: z.string().nullable(),
      hero_url: z.string().nullable(),
    })
    .nullable(),
  model: z.string(),
});

export type Extracted = z.infer<typeof extractedSchema>;

export function parseExtracted(value: unknown) {
  const parsed = extractedSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
